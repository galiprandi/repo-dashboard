import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { Event } from "@/api/seki.type";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import DayJS from "@/lib/dayjs";

const timelineStatusTextColor = (state: string) => {
	switch (state) {
		case "SUCCESS":
			return "text-emerald-600";
		case "FAILED":
			return "text-red-600";
		case "WARN":
			return "text-amber-600";
		case "RUNNING":
		case "PENDING":
			return "text-blue-600";
		default:
			return "text-muted-foreground";
	}
};

const timelineStatusIcon = (state: string) => {
	const baseClass = `w-3 h-3 ${timelineStatusTextColor(state)}`;
	switch (state) {
		case "SUCCESS":
			return <CheckCircle2 className={baseClass} />;
		case "FAILED":
			return <XCircle className={baseClass} />;
		case "WARN":
			return <AlertTriangle className={baseClass} />;
		case "RUNNING":
		case "PENDING":
			return <Loader2 className={`${baseClass} animate-spin`} />;
		default:
			return null;
	}
};

const timelineStatusColor = (state: string) => {
	switch (state) {
		case "SUCCESS":
			return "bg-green-500";
		case "FAILED":
			return "bg-red-500";
		case "WARN":
			return "bg-amber-500";
		case "RUNNING":
		case "PENDING":
			return "bg-blue-500 animate-pulse";
		default:
			return "bg-muted";
	}
};

const formatDuration = (start: string, end?: string) => {
	const startDate = DayJS(start);
	const endDate = end ? DayJS(end) : DayJS();
	const diffSecs = Math.max(0, endDate.diff(startDate, "second"));
	const mins = Math.floor(diffSecs / 60);
	const secs = diffSecs % 60;
	return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

interface MiniTimelineProps {
	events: Event[];
}

export function MiniTimeline({ events }: MiniTimelineProps) {
	return (
		<div className="flex gap-0.5">
			{events.map((event) => (
				<HoverCard key={event.id} openDelay={100} closeDelay={100}>
					<HoverCardTrigger asChild>
						<button
							type="button"
							className={`h-1.5 w-6 rounded-full transition-all hover:opacity-80 ${timelineStatusColor(
								event.state,
							)}`}
						/>
					</HoverCardTrigger>
					<HoverCardContent
						side="top"
						align="center"
						sideOffset={6}
						className="p-2 w-fit max-w-xs"
					>
						<div className="space-y-1.5">
							<div className="flex items-center gap-2">
								{timelineStatusIcon(event.state)}
								<span
									className={`text-xs font-semibold ${timelineStatusTextColor(
										event.state,
									)}`}
								>
									{event.label.es}
								</span>
							</div>
							<div className="text-[10px] text-muted-foreground border-t pt-1 whitespace-nowrap">
								{`${DayJS(event.updated_at || event.created_at).fromNow()} (${formatDuration(
									event.created_at,
									event.updated_at,
								)})`}
							</div>
						</div>
					</HoverCardContent>
				</HoverCard>
			))}
		</div>
	);
}
