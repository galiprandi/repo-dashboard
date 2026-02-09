import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useGitCommits } from "@/hooks/useGitCommits";
import { useGitTags } from "@/hooks/useGitTags";
import DayJS from "@/lib/dayjs";

interface TimelineEvent {
	id: string;
	label: {
		es: string;
		en?: string;
		br?: string;
	};
	state: string;
	created_at: string;
	updated_at: string;
}

interface DeployStatusCardProps {
	org: string;
	product: string;
	stage: "staging" | "production";
	events: TimelineEvent[];
}

const getStatusIcon = (state: string) => {
	switch (state) {
		case "SUCCESS":
			return <CheckCircle2 className="w-3 h-3 text-green-500" />;
		case "FAILED":
			return <XCircle className="w-3 h-3 text-red-500" />;
		case "WARN":
		case "WARNING":
			return <AlertTriangle className="w-3 h-3 text-amber-500" />;
		case "RUNNING":
		case "PENDING":
			return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
		default:
			return null;
	}
};

const getStatusColor = (state: string) => {
	switch (state) {
		case "SUCCESS":
			return "bg-green-500";
		case "FAILED":
			return "bg-red-500";
		case "WARN":
		case "WARNING":
			return "bg-amber-500";
		case "RUNNING":
		case "PENDING":
			return "bg-blue-500 animate-pulse";
		default:
			return "bg-muted";
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

function MiniTimeline({ events }: { events: TimelineEvent[] }) {
	return (
		<div className="flex gap-0.5">
			{events.map((event) => (
				<HoverCard key={event.id} openDelay={100} closeDelay={100}>
					<HoverCardTrigger asChild>
						<button
							type="button"
							className={`h-1.5 w-6 rounded-full transition-all hover:opacity-80 ${getStatusColor(
								event.state,
							)}`}
						/>
					</HoverCardTrigger>
					<HoverCardContent
						side="top"
						align="center"
						sideOffset={6}
						className="w-56 p-2"
					>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium">{event.label.es}</span>
								{getStatusIcon(event.state)}
							</div>
							<div className="text-[10px] text-muted-foreground">
								<div className="flex justify-between py-0.5">
									<span>Inicio:</span>
									<span>{DayJS(event.created_at).fromNow()}</span>
								</div>
								<div className="flex justify-between py-0.5 border-t">
									<span>Duración:</span>
									<span>
										{formatDuration(event.created_at, event.updated_at)}
									</span>
								</div>
							</div>
						</div>
					</HoverCardContent>
				</HoverCard>
			))}
		</div>
	);
}

export function DeployStatusCard({
	org,
	product,
	stage,
	events,
}: DeployStatusCardProps) {
	const fullProduct = `${org}/${product}`;
	const { latestTag } = useGitTags({ repo: fullProduct });
	const { latestCommit } = useGitCommits({ repo: fullProduct });

	const isStaging = stage === "staging";
	const displayVersion = isStaging ? latestCommit?.shortHash : latestTag?.name;
	const accentColor = isStaging ? "bg-blue-500" : "bg-purple-500";

	const runningEvent = events.find(
		(e) => e.state === "RUNNING" || e.state === "PENDING",
	);
	const hasFailed = events.some((e) => e.state === "FAILED");
	const hasWarn = events.some(
		(e) => e.state === "WARN" || e.state === "WARNING",
	);
	const allSuccess =
		events.length > 0 && events.every((e) => e.state === "SUCCESS");

	const completedEvents = events.filter(
		(e) => e.state === "SUCCESS" || e.state === "WARN" || e.state === "WARNING",
	);
	const deployDate =
		completedEvents.length > 0
			? completedEvents[completedEvents.length - 1].updated_at
			: events[0]?.created_at;

	const statusLabel = runningEvent
		? "Deploying..."
		: hasFailed
			? "Failed"
			: hasWarn
				? "Completed with warnings"
				: allSuccess
					? "Ready"
					: "Pending";

	return (
		<div className="bg-card border rounded-lg p-3 mb-4">
			<div className="flex items-center gap-3">
				<div className={`w-1 h-8 rounded-full shrink-0 ${accentColor}`} />
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground font-medium uppercase tracking-wide">
							{stage}
						</span>
						<span className="font-mono text-sm font-medium">
							{displayVersion || "—"}
						</span>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="truncate">{latestCommit?.author}</span>
						<span>·</span>
						<span>
							{deployDate
								? DayJS(deployDate).format("MMM D, HH:mm")
								: "—"}
						</span>
						<span>·</span>
						<span
							className={`font-medium ${
								runningEvent
									? "text-blue-600"
									: hasFailed
										? "text-red-600"
										: hasWarn
											? "text-amber-600"
											: allSuccess
												? "text-green-600"
												: ""
							}`}
						>
							{statusLabel}
						</span>
					</div>
				</div>
				{events.length > 0 && (
					<div className="shrink-0">
						<MiniTimeline events={events} />
					</div>
				)}
			</div>
		</div>
	);
}
