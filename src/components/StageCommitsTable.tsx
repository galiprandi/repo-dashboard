import { Link } from "@tanstack/react-router";
import { type GitCommit, useGitCommits } from "@/hooks/useGitCommits";
import { type GitTag, useGitTags } from "@/hooks/useGitTags";

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
	limit?: number;
}

export function StageCommitsTable({
	stage,
	org,
	product,
	limit = 10,
}: StageCommitsTableProps) {
	const fullRepo = `${org}/${product}`;

	const { commits, isLoading: isLoadingCommits } = useGitCommits({
		repo: fullRepo,
		limit,
		enabled: stage === "staging",
	});

	const { tags, isLoading: isLoadingTags } = useGitTags({
		repo: fullRepo,
		limit,
		enabled: stage === "production",
	});

	const isLoading = stage === "staging" ? isLoadingCommits : isLoadingTags;
	return (
		<div className="p-4 border rounded-lg space-y-2">
			<h3 className="font-medium">
				{stage === "staging" ? "Commits recientes" : "Tags disponibles"}
			</h3>
			<div className="border rounded-lg overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							<th className="px-4 py-2 text-left font-medium">
								{stage === "staging" ? "Hash" : "Tag"}
							</th>
							<th className="px-4 py-2 text-left font-medium">Fecha</th>
							<th className="px-4 py-2 text-left font-medium">Autor</th>
							<th className="px-4 py-2 text-left font-medium">Mensaje</th>
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
										<Link
											to="/product/$org/$product"
											params={{ org, product }}
											search={{ stage: "staging", event: "commit" }}
											className="font-mono text-xs hover:text-primary"
										>
											{c.hash.slice(0, 7)}
										</Link>
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{c.date ? new Date(c.date).toLocaleString() : "-"}
									</td>
									<td className="px-4 py-3">{c.author || "-"}</td>
									<td className="px-4 py-3 text-muted-foreground truncate max-w-[300px]">
										{c.message || "-"}
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
											<Link
												to="/product/$org/$product"
												params={{ org, product }}
												search={{ stage: "production", event: "tag" }}
												className="font-mono text-xs hover:text-primary"
											>
												{t.name}
											</Link>
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{t.date ? new Date(t.date).toLocaleString() : "-"}
										</td>
										<td className="px-4 py-3">-</td>
										<td className="px-4 py-3 text-muted-foreground truncate max-w-[300px]">
											Tag: {t.name}
										</td>
									</tr>
								))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
