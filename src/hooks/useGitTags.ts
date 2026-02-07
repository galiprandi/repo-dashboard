import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface GitTag {
	name: string;
	commit: string;
	date: string;
	author: {
		name: string;
		email: string;
		date: string;
	};
	zipball_url: string;
	tarball_url: string;
}

interface UseGitTagsOptions {
	repo: string;
	limit?: number;
	enabled?: boolean;
}

// Tipo intermedio para el parsing inicial de tags desde la API
interface GitTagFromAPI {
	name: string;
	commit: string;
	zipball_url: string;
	tarball_url: string;
}

export function useGitTags({
	repo,
	limit = 15,
	enabled = true,
}: UseGitTagsOptions) {
	const { data: tags, ...rest } = useQuery<GitTag[]>({
		queryKey: ["git", "tags", repo, limit],
		queryFn: async () => {
			// First get the tags list
			const tagsCommand = `gh api repos/${repo}/tags --paginate --jq '.[] | {name: .name, commit: .commit.sha, zipball_url: .zipball_url, tarball_url: .tarball_url}'`;
			const tagsResponse = await axios.post("/api/exec", {
				command: tagsCommand,
			});

			const tagLines = tagsResponse.data.stdout
				.trim()
				.split("\n")
				.filter((line: string) => line?.startsWith("{"));

			const tags = tagLines
				.map((line: string) => {
					try {
						return JSON.parse(line) as GitTagFromAPI;
					} catch {
						return null;
					}
				})
				.filter(Boolean) as GitTagFromAPI[];

			// Get commit details for each tag
			const tagsWithDetails = await Promise.all(
				tags.map(async (tag: GitTagFromAPI) => {
					try {
						const commitCommand = `gh api repos/${repo}/commits/${tag.commit} --jq '{date: .commit.committer.date, message: .message, author: {name: .commit.author.name, email: .commit.author.email, date: .commit.author.date}}'`;
						const commitResponse = await axios.post("/api/exec", {
							command: commitCommand,
						});
						const commitDetails = JSON.parse(commitResponse.data.stdout.trim());

						return {
							...tag,
							...commitDetails,
							date: commitDetails.date || commitDetails.author.date,
						};
					} catch {
						// Fallback if commit details fail
						return {
							...tag,
							date: null,
							message: null,
							author: { name: null, email: null, date: null },
						};
					}
				}),
			);

			return tagsWithDetails
				.sort(
					(a: GitTag, b: GitTag) =>
						new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
				)
				.slice(0, limit);
		},
		enabled: enabled && !!repo,
		staleTime: 5 * 60 * 1000,
	});

	const latestTag = tags?.[0];

	return { tags, latestTag, ...rest };
}
