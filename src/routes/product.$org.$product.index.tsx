import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { DisplayInfo } from "@/components/DislpayInfo";
import { StageCommitsTable } from "@/components/StageCommitsTable";
import { StageGitInfo } from "@/components/StageGitInfo";
import { useCommit } from "@/hooks/useCommit";
import { useGitCommits } from "@/hooks/useGitCommits";
import { useGitTags } from "@/hooks/useGitTags";

export const Route = createFileRoute("/product/$org/$product/")({
	component: ProductIndex,
});

function ProductIndex() {
	const { org, product } = Route.useParams();
	const fullProduct = `${org}/${product}`;
	const [activeStage, setActiveStage] = useState<"staging" | "production">(
		"production",
	);

	const { latestCommit } = useGitCommits({
		repo: fullProduct,
	});
	const { latestTag } = useGitTags({
		repo: fullProduct,
	});

	const commitHash =
		activeStage === "staging" ? latestCommit?.hash : latestTag?.commit;

	const tag = activeStage === "staging" ? latestTag : latestTag;

	const { commit: commitDetails, isLoading: isLoadingCommitDetails } =
		useCommit({
			repo: fullProduct,
			commitHash,
			enabled: Boolean(commitHash),
		});

	return (
		<div>
			{/* Environment Selector - Pill Style */}
			<div className="flex bg-muted rounded-lg p-1 mb-10">
				<button
					type="button"
					onClick={() => setActiveStage("production")}
					className={`px-4 py-1.5 text-sm rounded-md transition-all ${
						activeStage === "production"
							? "bg-white shadow-sm text-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Production
				</button>
				<button
					type="button"
					onClick={() => setActiveStage("staging")}
					className={`px-4 py-1.5 text-sm rounded-md transition-all ${
						activeStage === "staging"
							? "bg-white shadow-sm text-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Staging
				</button>
			</div>

			{/* Current Deployment Card - Clean & Minimal */}
			<div className="mb-8">
				<h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
					Last {activeStage === "staging" ? "Commit" : "Tag"}
				</h2>
				<LastDeployCard org={org} product={product} stage={activeStage} />
			</div>

			{/* Git Info Section */}
			<div className="mb-8">
				<h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
					Deployment Details
				</h2>
				<StageGitInfo
					stage={activeStage}
					commitDetails={commitDetails}
					commitHash={commitHash}
					tag={tag}
					isLoadingCommit={isLoadingCommitDetails}
				/>
			</div>

			{/* History Section */}
			<div>
				<h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
					{activeStage === "staging" ? "Recent Commits" : "Recent Tags"}
				</h2>
				<StageCommitsTable
					stage={activeStage}
					org={org}
					product={product}
					limit={10}
				/>
			</div>
		</div>
	);
}

interface LastDeployCardProps {
	org: string;
	product: string;
	stage: "staging" | "production";
}

function LastDeployCard({ org, product, stage }: LastDeployCardProps) {
	const fullProduct = `${org}/${product}`;
	const { latestTag } = useGitTags({
		repo: fullProduct,
	});
	const { latestCommit } = useGitCommits({
		repo: fullProduct,
	});

	const isStaging = stage === "staging";
	const displayVersion = isStaging ? latestCommit?.shortHash : latestTag?.name;

	const fullCommitHash = latestCommit?.hash;
	const tagName = latestTag?.name;
	const message = isStaging ? latestCommit?.message : latestTag?.commit;
	const author = isStaging ? latestCommit?.author : null;
	const date = isStaging ? latestCommit?.date : null;

	// Build navigation params
	const pipelineIdentifier = isStaging
		? { commit: fullCommitHash }
		: { commit: fullCommitHash, tag: tagName };

	return (
		<Link
			to="/product/$org/$product/pipeline/$stage"
			params={{ org, product, stage }}
			search={pipelineIdentifier}
			className="group flex items-center justify-between p-5 bg-card border rounded-xl hover:shadow-sm transition-all"
		>
			<div className="flex items-center gap-5">
				<div
					className={`w-2 h-12 rounded-full ${stage === "production" ? "bg-purple-500" : "bg-blue-500"}`}
				/>

				<div>
					{/* Version & Branch */}
					<div className="flex items-center gap-3 mb-1">
						<span className="font-mono text-lg font-medium">
							{displayVersion || "—"}
						</span>
						<span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
							{stage}
						</span>
					</div>

					{/* Meta */}
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						{<DisplayInfo type="message" value={message} maxChar={70} />}
						{<DisplayInfo type="author" value={author} maxChar={30} />}
						{<DisplayInfo type="dates" value={date} />}
					</div>
				</div>
			</div>

			{/* Action */}
			<ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
		</Link>
	);
}
