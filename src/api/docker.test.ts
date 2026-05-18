import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    checkDockerInstalled,
    checkDockerAccess,
    getContainers,
    getContainerLogs,
    startContainer,
    restartContainer,
    stopContainer,
    getContainerStats
} from './docker';
import { runCommand } from '@/api/exec';

vi.mock('@/api/exec', () => ({ runCommand: vi.fn() }));

describe('docker api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkDockerInstalled', () => {
        it('returns true when docker is installed', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'Docker version 27.0.1, build abc', stderr: '', success: true });
            expect(await checkDockerInstalled()).toBe(true);
        });

        it('returns false when docker version command fails', async () => {
            vi.mocked(runCommand).mockRejectedValueOnce(new Error('command not found'));
            expect(await checkDockerInstalled()).toBe(false);
        });

        it('returns false when output does not contain version string', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'some other output', stderr: '', success: true });
            expect(await checkDockerInstalled()).toBe(false);
        });
    });

    describe('checkDockerAccess', () => {
        it('returns true when docker ps succeeds', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'CONTAINER ID...', stderr: '', success: true });
            expect(await checkDockerAccess()).toBe(true);
        });

        it('returns false when docker ps fails', async () => {
            vi.mocked(runCommand).mockRejectedValueOnce(new Error('permission denied'));
            expect(await checkDockerAccess()).toBe(false);
        });
    });

    describe('getContainers', () => {
        it('parses multiple json line output', async () => {
            const out =
                '{"ID":"1","Names":"c1","Image":"i1","Status":"Up","Ports":"80","CreatedAt":"now","RunningFor":"1h"}\n' +
                '{"ID":"2","Names":"c2","Image":"i2","Status":"Exited","Ports":"","CreatedAt":"yesterday","RunningFor":"2h"}';
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });

            const containers = await getContainers();
            expect(containers).toHaveLength(2);
            expect(containers[0].id).toBe('1');
            expect(containers[0].name).toBe('c1');
            expect(containers[1].id).toBe('2');
            expect(containers[1].status).toBe('Exited');
        });

        it('handles missing fields in json lines', async () => {
            const out = '{"ID":"1"}';
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });
            const containers = await getContainers();
            expect(containers[0]).toMatchObject({
                id: '1',
                name: 'unnamed',
                status: 'unknown'
            });
        });

        it('handles empty output', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: '', stderr: '', success: true });
            const containers = await getContainers();
            expect(containers).toEqual([]);
        });

        it('handles malformed json lines gracefully by skipping them', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const out = '{"ID":"1","Names":"c1","Image":"i1","Status":"Up","Ports":"80","CreatedAt":"now","RunningFor":"1h"}\ninvalid json\n{"ID":"3","Names":"c3","Image":"i3","Status":"Up","Ports":"80","CreatedAt":"now","RunningFor":"1h"}';
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });

            const containers = await getContainers();
            expect(containers).toHaveLength(2);
            expect(containers[0].id).toBe('1');
            expect(containers[1].id).toBe('3');
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('returns empty array and logs error on command failure', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(runCommand).mockRejectedValueOnce(new Error('docker daemon down'));

            const containers = await getContainers();
            expect(containers).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('getContainerLogs', () => {
        it('fetches logs with default tail', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'line1\nline2', stderr: '', success: true });
            const logs = await getContainerLogs('abc123');
            expect(runCommand).toHaveBeenCalledWith('docker logs --tail=100 abc123');
            expect(logs).toBe('line1\nline2');
        });

        it('uses stderr if stdout is empty', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: '', stderr: 'error log', success: true });
            const logs = await getContainerLogs('abc123');
            expect(logs).toBe('error log');
        });

        it('replaces literal \\n with actual newlines', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'line1\\nline2', stderr: '', success: true });
            const logs = await getContainerLogs('abc123');
            expect(logs).toBe('line1\nline2');
        });

        it('returns empty string and logs error for invalid container id', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const logs = await getContainerLogs('invalid; rm -rf /');
            expect(logs).toBe('');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('returns empty string and logs error on command failure', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(runCommand).mockRejectedValueOnce(new Error('fail'));
            const logs = await getContainerLogs('abc123');
            expect(logs).toBe('');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('container lifecycle', () => {
        it('startContainer returns true on success', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'abc', stderr: '', success: true });
            expect(await startContainer('abc')).toBe(true);
            expect(runCommand).toHaveBeenCalledWith('docker start abc');
        });

        it('startContainer returns false on failure', async () => {
            vi.mocked(runCommand).mockRejectedValueOnce(new Error('fail'));
            expect(await startContainer('abc')).toBe(false);
        });

        it('restartContainer returns true on success', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'abc', stderr: '', success: true });
            expect(await restartContainer('abc')).toBe(true);
            expect(runCommand).toHaveBeenCalledWith('docker restart abc');
        });

        it('stopContainer returns true on success', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: 'abc', stderr: '', success: true });
            expect(await stopContainer('abc')).toBe(true);
            expect(runCommand).toHaveBeenCalledWith('docker stop abc');
        });
    });

    describe('getContainerStats', () => {
        it('parses docker stats JSON output', async () => {
            const out = JSON.stringify({
                CPUPerc: '1.5%',
                MemUsage: '10MiB / 1GiB',
                MemPerc: '1%',
                NetIO: '1kB / 2kB',
                BlockIO: '0B / 0B'
            });
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });

            const stats = await getContainerStats('abc');
            expect(runCommand).toHaveBeenCalledWith(expect.stringContaining('--format json'));
            expect(stats).toEqual({
                cpuPercent: '1.5%',
                memUsage: '10MiB',
                memPercent: '1%',
                netIO: '1kB / 2kB',
                blockIO: '0B / 0B'
            });
        });

        it('handles missing fields in JSON stats', async () => {
            const out = JSON.stringify({ CPUPerc: '2%' });
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });
            const stats = await getContainerStats('abc');
            expect(stats).toMatchObject({
                cpuPercent: '2%',
                memUsage: 'N/A',
                blockIO: 'N/A'
            });
        });

        it('falls back to manual parsing for non-JSON output', async () => {
            const out =
                'CONTAINER CPU % MEM USAGE / LIMIT MEM % NET I/O BLOCK I/O PIDS\n' +
                'abc 1.5% 10MiB / 1GiB 1% 1kB / 2kB 0B / 0B 1';
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });

            const stats = await getContainerStats('abc');
            expect(stats).toMatchObject({
                cpuPercent: '1.5%',
                memUsage: '10MiB'
            });
        });

        it('manual parsing handles invalid lines', async () => {
            const out = 'HEADER\nshort_line';
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });
            const stats = await getContainerStats('abc');
            expect(stats).toMatchObject({
                cpuPercent: '0%',
                memUsage: 'N/A'
            });
        });

        it('manual parsing uses defaults if pattern not found', async () => {
            const out = 'CONTAINER NO_PERCENT NO_BYTES';
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: out, stderr: '', success: true });
            const stats = await getContainerStats('abc');
            expect(stats).toMatchObject({
                cpuPercent: '0%',
                memUsage: 'N/A'
            });
        });

        it('returns default stats for empty output', async () => {
            vi.mocked(runCommand).mockResolvedValueOnce({ stdout: '', stderr: '', success: true });
            const stats = await getContainerStats('abc');
            expect(stats).toEqual({
                cpuPercent: '0%',
                memUsage: 'N/A',
                memPercent: '0%',
                netIO: 'N/A',
                blockIO: 'N/A'
            });
        });

        it('returns null and logs error on command failure', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(runCommand).mockRejectedValueOnce(new Error('fail'));

            const stats = await getContainerStats('abc');
            expect(stats).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
