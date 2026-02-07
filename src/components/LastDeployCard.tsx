import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useGitCommits } from "@/hooks/useGitCommits";
import { useGitTags } from "@/hooks/useGitTags";
import { DisplayInfo } from "./DislpayInfo";

interface LastDeployCardProps {
	org: string;
	product: string;
	stage: "staging" | "production";
}

export const LastDeployCard = ({
	org,
	product,
	stage,
}: LastDeployCardProps) => {
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

	// Build navigation params
	const pipelineIdentifier = isStaging
		? { commit: fullCommitHash }
		: { commit: fullCommitHash, tag: tagName };

	return (
		<div className="mb-8">
			<h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
				Last {stage === "staging" ? "Commit" : "Tag"}
			</h2>
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
							{
								<DisplayInfo
									type="message"
									value={latestCommit?.message}
									maxChar={70}
								/>
							}
							{
								<DisplayInfo
									type="author"
									value={latestCommit?.author}
									maxChar={30}
								/>
							}
							{<DisplayInfo type="dates" value={latestCommit?.date} />}
						</div>
					</div>
				</div>

				{/* Action */}
				<ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
			</Link>
		</div>
	);
};
