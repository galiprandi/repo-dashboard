import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SekiMonitor } from "@/components/SekiMonitor/SekiMonitor";
import { StageCommitsTable } from "@/components/StageCommitsTable";
import { useGitCommits } from "@/hooks/useGitCommits";
import { useGitTags } from "@/hooks/useGitTags";
import { usePipeline, usePipelineWithTag } from "@/hooks/usePipeline";

export const Route = createFileRoute("/product/$org/$product/")({
	component: ProductIndex,
});

function ProductIndex() {
	const { org, product } = Route.useParams();
	const [activeStage, setActiveStage] = useState<"staging" | "production">(
		"production",
	);
	const fullProduct = `${org}/${product}`;
	const isStaging = activeStage === "staging";

	const { latestCommit } = useGitCommits({ repo: fullProduct });
	const { latestTag } = useGitTags({ repo: fullProduct });

	const stagingPipeline = usePipeline({
		product: fullProduct,
		commit: latestCommit?.hash ?? "",
		enabled: isStaging && !!latestCommit?.hash,
	});

	const prodPipeline = usePipelineWithTag({
		product: fullProduct,
		commit: latestCommit?.hash ?? "",
		tag: latestTag?.name ?? "",
		enabled: !isStaging && !!latestCommit?.hash && !!latestTag?.name,
	});

	const pipeline = isStaging ? stagingPipeline.data : prodPipeline.data;

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
			{pipeline ? (
				<SekiMonitor pipeline={pipeline} stage={activeStage} />
			) : (
				<div className="mb-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
					No pipeline data available yet for this stage.
				</div>
			)}
			<div>
				<br />
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
