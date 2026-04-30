import { useQuery } from "@tanstack/react-query";
import { runCommand } from "@/api/exec";

const EXCLUDED_PATTERNS = [
	/package-lock\.json/,
	/pnpm-lock\.yaml/,
	/yarn\.lock/,
	/bun\.lockb/,
	/\.svg$/,
	/\.png$/,
	/\.jpg$/,
	/\.jpeg$/,
	/\.gif$/,
	/\.ico$/,
	/\.woff/,
	/\.ttf$/,
	/\.eot$/,
	/\.mp4$/,
	/\.webm$/,
	/dist\//,
	/build\//,
	/coverage\//,
	/__snapshots__\//,
	/\.test\.(ts|tsx|js|jsx)$/,
	/\.spec\.(ts|tsx|js|jsx)$/,
];

const MAX_LINES_PER_FILE = 80;
const MAX_TOTAL_CHARS = 20000;

function filterDiff(diff: string): string {
	const lines = diff.split("\n");
	const result: string[] = [];
	let currentFileLines: string[] = [];
	let currentFileExcluded = false;
	let currentFileLineCount = 0;

	for (const line of lines) {
		if (line.startsWith("diff --git")) {
			if (!currentFileExcluded && currentFileLines.length > 0) {
				result.push(...currentFileLines.slice(0, MAX_LINES_PER_FILE));
			}
			currentFileLines = [];
			currentFileExcluded = EXCLUDED_PATTERNS.some((p) => p.test(line));
			currentFileLineCount = 0;
			if (!currentFileExcluded) {
				currentFileLines.push(line);
				currentFileLineCount++;
			}
		} else if (!currentFileExcluded && currentFileLineCount < MAX_LINES_PER_FILE) {
			currentFileLines.push(line);
			currentFileLineCount++;
		}
	}

	if (!currentFileExcluded && currentFileLines.length > 0) {
		result.push(...currentFileLines.slice(0, MAX_LINES_PER_FILE));
	}

	let output = result.join("\n");
	if (output.length > MAX_TOTAL_CHARS) {
		output = output.slice(0, MAX_TOTAL_CHARS);
		const lastNewline = output.lastIndexOf("\n");
		if (lastNewline > MAX_TOTAL_CHARS * 0.8) {
			output = output.slice(0, lastNewline);
		}
		output += "\n\n... [contenido truncado por tamaño]";
	}
	return output;
}

interface UseGitDiffOptions {
	repo: string;
	base: string;
	head: string;
	enabled?: boolean;
}

export function useGitDiff({ repo, base, head, enabled = true }: UseGitDiffOptions) {
	return useQuery({
		queryKey: ["git", "diff", repo, base, head],
		queryFn: async () => {
			const command = `gh api -H "Accept: application/vnd.github.diff" repos/${repo}/compare/${base}...${head}`;
			const response = await runCommand(command);
			return filterDiff(response.stdout);
		},
		enabled: enabled && !!repo && !!base && !!head,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}
