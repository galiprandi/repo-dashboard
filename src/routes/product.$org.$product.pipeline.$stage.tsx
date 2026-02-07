import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	GitCommit,
	Loader2,
	User,
	XCircle,
} from "lucide-react";
import { LastDeployCard } from "@/components/LastDeployCard";
import { usePipeline, usePipelineWithTag } from "@/hooks/usePipeline";

export const Route = createFileRoute("/product/$org/$product/pipeline/$stage")({
	component: PipelineDetail,
});

function PipelineDetail() {
	const { org, product, stage } = Route.useParams();
	const search = Route.useSearch();
	const fullProduct = `${org}/${product}`;

	// Production uses both commit and tag, Staging uses only commit
	const isProduction = stage === "production";
	const commit = search.commit as string;
	const tag = search.tag as string;

	// Use both hooks but only enable the appropriate one
	const stagingQuery = usePipeline({
		product: fullProduct,
		commit,
		enabled: !isProduction && !!commit,
	});

	const productionQuery = usePipelineWithTag({
		product: fullProduct,
		commit,
		tag,
		enabled: isProduction && !!commit && !!tag,
	});

	const {
		data: pipeline,
		isLoading,
		error,
	} = isProduction ? productionQuery : stagingQuery;

	if (isLoading) {
		return (
			<div className="max-w-5xl mx-auto px-6 py-8">
				<div className="flex items-center justify-center h-64">
					<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
				</div>
			</div>
		);
	}

	if (error || !pipeline) {
		return (
			<div className="max-w-5xl mx-auto px-6 py-8">
				<div className="p-8 border rounded-xl bg-red-50/50 text-red-600 text-center">
					<AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
					<p className="font-medium">Error loading pipeline</p>
					{error && (
						<p className="text-sm mt-2 text-red-500">
							{error instanceof Error ? error.message : "Unknown error"}
						</p>
					)}
					<p className="text-xs mt-2 text-muted-foreground">
						Product: {fullProduct}
						{isProduction
							? `, Tag: ${tag}`
							: `, Commit: ${commit?.slice(0, 7)}...`}
					</p>
				</div>
			</div>
		);
	}

	const getStatusIcon = (state: string) => {
		switch (state) {
			case "completed":
				return <CheckCircle2 className="w-4 h-4 text-green-500" />;
			case "failed":
				return <XCircle className="w-4 h-4 text-red-500" />;
			case "running":
				return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
			default:
				return <AlertCircle className="w-4 h-4 text-gray-400" />;
		}
	};

	const getStatusColor = (state: string) => {
		switch (state) {
			case "completed":
				return "bg-green-500";
			case "failed":
				return "bg-red-500";
			case "running":
				return "bg-blue-500";
			default:
				return "bg-gray-400";
		}
	};

	const formatDuration = (start: string, end?: string) => {
		const startDate = new Date(start);
		const endDate = end ? new Date(end) : new Date();
		const diffMs = endDate.getTime() - startDate.getTime();
		const diffSecs = Math.floor(diffMs / 1000);
		const mins = Math.floor(diffSecs / 60);
		const secs = diffSecs % 60;
		return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
	};

	return (
		<div className="max-w-5xl mx-auto px-6 py-8">
			{/* Minimal Header */}
			<div className="flex items-center gap-4 mb-10">
				<Link
					to="/product/$org/$product"
					params={{ org, product }}
					className="text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium tracking-tight">Pipeline</h1>
					<p className="text-sm text-muted-foreground">{fullProduct}</p>
				</div>
			</div>
			<LastDeployCard org={org} product={product} stage={stage} />
			aqui
			<div>
				<h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
					Events
				</h2>
				<div className="space-y-1">
					{pipeline.events.map((event) => (
						<div
							key={event.id}
							className="group p-4 bg-card border rounded-xl hover:border-muted-foreground/20 transition-colors"
						>
							{/* Event Header */}
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-3">
									{getStatusIcon(event.state)}
									<span className="font-medium">
										{event.label.es || event.id}
									</span>
								</div>
								<span className="text-sm text-muted-foreground">
									{formatDuration(event.created_at, event.updated_at)}
								</span>
							</div>

							{/* Event Meta */}
							<div className="flex items-center gap-4 text-xs text-muted-foreground ml-7">
								<span>{new Date(event.created_at).toLocaleTimeString()}</span>
								{event.state === "completed" && (
									<span className="text-green-600">Completed</span>
								)}
								{event.state === "failed" && (
									<span className="text-red-600">Failed</span>
								)}
							</div>

							{/* Markdown Output */}
							{event.markdown && (
								<div className="mt-3 ml-7">
									<pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground">
										{event.markdown}
									</pre>
								</div>
							)}

							{/* Subevents */}
							{event.subevents && event.subevents.length > 0 && (
								<div className="mt-3 ml-7 space-y-2">
									{event.subevents.map((subevent) => (
										<div
											key={subevent.id}
											className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
										>
											<div className="flex items-center gap-2">
												{getStatusIcon(subevent.state)}
												<span className="text-sm">{subevent.label}</span>
											</div>
											<span className="text-xs text-muted-foreground">
												{formatDuration(
													subevent.created_at,
													subevent.updated_at,
												)}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
