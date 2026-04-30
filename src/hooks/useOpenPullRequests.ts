import { useQuery } from "@tanstack/react-query";
import { runCommand } from "../api/exec";

interface OpenPullRequestsResult {
	count: number;
	repoUrl: string;
}

export function useOpenPullRequests(repo: string) {
	return useQuery<OpenPullRequestsResult>({
		queryKey: ["github", "open-prs", repo],
		queryFn: async () => {
			const command = `gh pr list --repo ${repo} --state open --json number`;
			const { stdout } = await runCommand(command);
			const prs = JSON.parse(stdout);
			const count = Array.isArray(prs) ? prs.length : 0;
			const [org, name] = repo.split("/");
			return {
				count,
				repoUrl: `https://github.com/${org}/${name}/pulls`,
			};
		},
		enabled: !!repo,
		staleTime: 60 * 1000, // 1 minuto
		gcTime: 5 * 60 * 1000, // 5 minutos
	});
}
