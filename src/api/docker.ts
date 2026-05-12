import { runCommand } from '@/api/exec';

export interface ContainerInfo {
	id: string;
	name: string;
	status: string;
	ports: string;
	image: string;
	created: string;
	runningFor?: string;
}

/**
 * Sanitizes Docker container IDs to prevent command injection.
 * Docker container IDs are 64-character hex strings (typically displayed as 12-char short IDs).
 */
function sanitizeContainerId(containerId: string): string {
	if (!containerId) {
		throw new Error('Container ID cannot be empty');
	}
	// Docker container IDs are hexadecimal (0-9, a-f)
	const safeIdRegex = /^[a-f0-9]+$/i;
	if (!safeIdRegex.test(containerId)) {
		throw new Error(`Invalid container ID format: ${containerId}`);
	}
	return containerId;
}

/**
 * Verifies that Docker is installed and accessible.
 */
export async function checkDockerInstalled(): Promise<boolean> {
	try {
		const result = await runCommand('docker --version');
		return result.stdout.includes('Docker version');
	} catch {
		return false;
	}
}

/**
 * Verifies that the user can execute Docker commands (has proper permissions).
 */
export async function checkDockerAccess(): Promise<boolean> {
	try {
		await runCommand('docker ps');
		return true;
	} catch {
		return false;
	}
}

function parseContainers(output: string): ContainerInfo[] {
	try {
		// Docker --format json returns one JSON object per line, not an array
		const lines = output.trim().split('\n');
		const containers: ContainerInfo[] = [];

		for (const line of lines) {
			if (!line.trim()) continue;

			const container = JSON.parse(line) as {
				ID: string
				Image: string
				Status: string
				Ports: string
				CreatedAt: string
				Names: string
				RunningFor: string
			}

			containers.push({
				id: container.ID,
				image: container.Image,
				status: container.Status,
				ports: container.Ports,
				created: container.CreatedAt,
				name: container.Names,
				runningFor: container.RunningFor,
			})
		}

		return containers;
	} catch {
		return []
	}
}

/**
 * Lists all containers (running and stopped).
 */
export async function getContainers(): Promise<ContainerInfo[]> {
	try {
		const result = await runCommand('docker ps -a --format json');
		return parseContainers(result.stdout);
	} catch (error) {
		console.error('[Docker] Error getting containers:', error);
		return [];
	}
}

/**
 * Removes ANSI escape codes from log output.
 */
function removeAnsiCodes(text: string): string {
	// Remove ANSI escape codes in both formats: \x1b and \u001b
	// eslint-disable-next-line no-control-regex
	return text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\u001b\[[0-9;]*m/g, '');
}

/**
 * Gets logs from a container.
 */
export async function getContainerLogs(containerId: string, tail = 100): Promise<string> {
	const sanitizedId = sanitizeContainerId(containerId);
	const result = await runCommand(`docker logs --tail=${tail} ${sanitizedId}`);
	// Some containers use stdout, others use stderr
	// Use stderr if it has content, otherwise use stdout
	const logs = result.stderr.trim() || result.stdout.trim();
	// Replace literal \n with actual newlines
	const cleanLogs = logs.replace(/\\n/g, '\n');
	// Remove ANSI color codes
	return removeAnsiCodes(cleanLogs);
}

/**
 * Starts a stopped container.
 */
export async function startContainer(containerId: string): Promise<boolean> {
	try {
		const sanitizedId = sanitizeContainerId(containerId);
		await runCommand(`docker start ${sanitizedId}`);
		return true;
	} catch (error) {
		console.error('[Docker] Error starting container:', error);
		return false;
	}
}

/**
 * Restarts a container.
 */
export async function restartContainer(containerId: string): Promise<boolean> {
	try {
		const sanitizedId = sanitizeContainerId(containerId);
		await runCommand(`docker restart ${sanitizedId}`);
		return true;
	} catch (error) {
		console.error('[Docker] Error restarting container:', error);
		return false;
	}
}

/**
 * Stops a running container.
 */
export async function stopContainer(containerId: string): Promise<boolean> {
	try {
		const sanitizedId = sanitizeContainerId(containerId);
		await runCommand(`docker stop ${sanitizedId}`);
		return true;
	} catch (error) {
		console.error('[Docker] Error stopping container:', error);
		return false;
	}
}

export interface ContainerStats {
	cpuPercent: string;
	memUsage: string;
	memPercent: string;
	netIO: string;
	blockIO: string;
}

function parseStats(output: string): ContainerStats {
	const lines = output.trim().split('\n');
	const stats: ContainerStats = {
		cpuPercent: '0%',
		memUsage: 'N/A',
		memPercent: '0%',
		netIO: 'N/A',
		blockIO: 'N/A',
	};
	
	// Skip header
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('CONTAINER')) continue;
		
		// Docker stats --no-stream format: CONTAINER CPU % MEM USAGE / LIMIT MEM % NET I/O BLOCK I/O
		const parts = trimmed.split(/\s+/);
		
		if (parts.length >= 7) {
			stats.cpuPercent = parts[1];
			stats.memUsage = parts[2];
			stats.memPercent = parts[3];
			stats.netIO = parts[4];
			stats.blockIO = parts[5];
			break; // Only process first container (should be the one we queried)
		}
	}
	return stats;
}

/**
 * Gets statistics for a container (CPU, memory, network, disk I/O).
 */
export async function getContainerStats(containerId: string): Promise<ContainerStats | null> {
	try {
		const sanitizedId = sanitizeContainerId(containerId);
		const result = await runCommand(`docker stats --no-stream ${sanitizedId}`);
		return parseStats(result.stdout);
	} catch (error) {
		console.error('[Docker] Error getting container stats:', error);
		return null;
	}
}
