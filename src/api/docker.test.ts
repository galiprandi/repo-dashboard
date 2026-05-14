import { describe, it, expect, vi } from 'vitest';
import { checkDockerInstalled, getContainers } from './docker';
import { runCommand } from '@/api/exec';

vi.mock('@/api/exec', () => ({ runCommand: vi.fn() }));

describe('docker api', () => {
	it('checkDockerInstalled returns true on success', async () => {
		vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'Docker version 27', stderr: '', success: true });
		expect(await checkDockerInstalled()).toBe(true);
	});

	it('getContainers parses json line output', async () => {
		const out = '{"ID":"1","Names":"c1","Image":"i1","Status":"Up","Ports":"80","CreatedAt":"now","RunningFor":"1h"}';
		vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });
		const containers = await getContainers();
		expect(containers).toHaveLength(1);
		expect(containers[0].id).toBe('1');
	});
});
