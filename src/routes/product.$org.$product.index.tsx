import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LastDeployCard } from "@/components/LastDeployCard";
import { StageCommitsTable } from "@/components/StageCommitsTable";

export const Route = createFileRoute("/product/$org/$product/")({
	component: ProductIndex,
});

function ProductIndex() {
	const { org, product } = Route.useParams();
	const [activeStage, setActiveStage] = useState<"staging" | "production">(
		"production",
	);

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

			<LastDeployCard org={org} product={product} stage={activeStage} />

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
