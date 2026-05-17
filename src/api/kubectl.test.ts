import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkKubectlInstalled, getDeployments, setContext } from './kubectl';
import { runCommand } from '@/api/exec';

vi.mock('@/api/exec', () => ({
  runCommand: vi.fn(),
}));

describe('kubectl api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checkKubectlInstalled returns true when found', async () => {
    vi.mocked(runCommand).mockResolvedValue({ stdout: 'clientVersion', stderr: '', success: true });
    expect(await checkKubectlInstalled()).toBe(true);
  });

  it('setContext handles invalid context names safely', async () => {
    expect(await setContext('ctx; rm -rf')).toBe(false);
    expect(runCommand).not.toHaveBeenCalledWith(expect.stringContaining('rm -rf'));
  });

  it('getDeployments throws for invalid namespace format', async () => {
    await expect(getDeployments('invalid space')).rejects.toThrow('Invalid Kubernetes name format');
  });

  it('getDeployments parses output without namespace column', async () => {
    const mockOut = "NAME READY UP-TO-DATE AVAILABLE AGE\ndep1 1/1 1 1 1d";
    vi.mocked(runCommand).mockResolvedValue({ stdout: mockOut, stderr: '', success: true });
    const res = await getDeployments('default');
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('dep1');
    expect(res[0].namespace).toBe('');
  });

  it('getDeployments parses output with namespace column', async () => {
    const mockOut = "NAMESPACE NAME READY UP-TO-DATE AVAILABLE AGE\nns1 dep1 1/1 1 1 1d";
    vi.mocked(runCommand).mockResolvedValue({ stdout: mockOut, stderr: '', success: true });
    const res = await getDeployments();
    expect(res[0].namespace).toBe('ns1');
    expect(res[0].name).toBe('dep1');
  });

  it('setContext returns false when runCommand fails', async () => {
    vi.mocked(runCommand).mockRejectedValue(new Error('command failed'));
    expect(await setContext('valid-context')).toBe(false);
  });
});
