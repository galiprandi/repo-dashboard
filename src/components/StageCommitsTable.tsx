import { type GitCommit, useGitCommits } from "@/hooks/useGitCommits";
import { type GitTag, useGitTags } from "@/hooks/useGitTags";
import { DisplayInfo } from "./DislpayInfo";
import { CommitLink } from "./CommitLink";
import { TagLink } from "./TagLink";
import { Loader2 } from "lucide-react";

// Compare semantic versions (e.g., v2.0.7 > v1.0.24)
function compareVersions(a: string, b: string): number {
	const parseVersion = (v: string) => {
		const match = v.match(/v?(\d+)\.(\d+)\.(\d+)/);
		if (!match) return [0, 0, 0];
		return [
			parseInt(match[1], 10),
			parseInt(match[2], 10),
			parseInt(match[3], 10),
		];
	};

	const [majorA, minorA, patchA] = parseVersion(a);
	const [majorB, minorB, patchB] = parseVersion(b);

	if (majorB !== majorA) return majorB - majorA;
	if (minorB !== minorA) return minorB - minorA;
	return patchB - patchA;
}

interface StageCommitsTableProps {
	stage: "staging" | "production";
	org: string;
	product: string;
}

export function StageCommitsTable({
	stage,
	org,
	product,
}: StageCommitsTableProps) {
	const fullRepo = `${org}/${product}`;

	const { commits, isLoading: isLoadingCommits, hasNextPage, fetchNextPage, isFetchingNextPage } = useGitCommits({
		repo: fullRepo,
		enabled: stage === "staging",
	});

	const { tags, isLoading: isLoadingTags, hasNextPage: hasNextPageTags, fetchNextPage: fetchNextPageTags, isFetchingNextPage: isFetchingNextPageTags } = useGitTags({
		repo: fullRepo,
		enabled: stage === "production",
	});

	const isLoading = stage === "staging" ? isLoadingCommits : isLoadingTags;
	const isStaging = stage === "staging";
	const hasMore = isStaging ? hasNextPage : hasNextPageTags;
	const loadMore = isStaging ? fetchNextPage : fetchNextPageTags;
	const isLoadingMore = isStaging ? isFetchingNextPage : isFetchingNextPageTags;
	return (
		<div>
			<div className="overflow-hidden border rounded-lg">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							<th className="px-4 py-2 text-left font-medium">
								{stage === "staging" ? "Hash" : "Tag"}
							</th>
							<th className="px-4 py-2 text-left font-medium">Fecha</th>
							<th className="px-4 py-2 text-left font-medium">Autor</th>
							{isStaging && (
								<th className="px-4 py-2 text-left font-medium">Mensaje</th>
							)}
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td
									colSpan={4}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									Cargando...
								</td>
							</tr>
						) : stage === "staging" ? (
							commits?.map((c: GitCommit) => (
								<tr key={c.hash} className="border-t hover:bg-muted/50">
									<td className="px-4 py-3">
										<CommitLink hash={c.hash} org={org} repo={product} />
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										<DisplayInfo value={c.date} type="dates" />
									</td>
									<td className="px-4 py-3">
										<DisplayInfo value={c.author} type="author" maxChar={30} />
									</td>
									<td className="px-4 py-3 text-muted-foreground truncate max-w-[300px]">
										<DisplayInfo
											value={c.message}
											type="message"
											maxChar={50}
										/>
									</td>
								</tr>
							))
						) : (
							tags
								?.slice()
								.sort((a: GitTag, b: GitTag) => compareVersions(a.name, b.name))
								.map((t: GitTag) => (
									<tr key={t.name} className="border-t hover:bg-muted/50">
										<td className="px-4 py-3">
											<TagLink tagName={t.name} org={org} repo={product} />
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											<DisplayInfo value={t.date} type="dates" />
										</td>
										<td className="px-4 py-3">
											<DisplayInfo
												value={t.author.name}
												type="author"
												maxChar={50}
											/>
										</td>
									</tr>
								))
						)}
					</tbody>
				</table>
			</div>
			{hasMore && !isLoading && (
				<div className="mt-3 flex justify-center">
					<button
						type="button"
						onClick={() => loadMore()}
						disabled={isLoadingMore}
						className="flex items-center gap-2 px-4 py-2 text-sm bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
						{isLoadingMore ? "Cargando..." : "Ver más"}
					</button>
				</div>
			)}
		</div>
	);
}
