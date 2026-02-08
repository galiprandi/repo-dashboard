import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
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

interface PipelineTimelineProps {
	events: TimelineEvent[];
	onEventClick?: (eventId: string) => void;
	title?: string;
}

const getStatusIcon = (state: string) => {
	switch (state) {
		case "SUCCESS":
			return <CheckCircle2 className="w-4 h-4 text-green-500" />;
		case "FAILED":
			return <XCircle className="w-4 h-4 text-red-500" />;
		case "RUNNING":
		case "PENDING":
			return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
		default:
			return null;
	}
};

const formatDuration = (start: string, end?: string) => {
	const startDate = new Date(start);
	const endDate = end ? new Date(end) : new Date();
	const diffMs = endDate.getTime() - startDate.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const mins = Math.floor(diffSecs / 60);
	const secs = diffSecs % 60;
	return mins > 0 ? `dur ${mins}m ${secs}s` : `dur ${secs}s`;
};

export function PipelineTimeline({
	events,
	onEventClick,
	title = "Seki Deployment",
}: PipelineTimelineProps) {
	return (
		<div className="mb-8">
			<h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
				{title}
			</h2>
			<div className="bg-card border rounded-xl p-6">
				<div className="flex gap-2 justify-center overflow-x-auto">
					{events.map((event, index) => {
						const isCompleted = event.state === "SUCCESS";
						const isFailed = event.state === "FAILED";
						const isRunning =
							event.state === "RUNNING" || event.state === "PENDING";

						return (
							<div key={event.id} className="flex items-start shrink-0">
								{/* Step Indicator with HoverCard */}
								<HoverCard openDelay={100} closeDelay={100}>
									<HoverCardTrigger asChild>
										<button
											type="button"
											onClick={() => onEventClick?.(event.id)}
											className="flex flex-col items-center gap-2 p-1 rounded-lg transition-all cursor-pointer"
										>
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
													isCompleted
														? "bg-green-500 border-green-500 text-white"
														: isFailed
															? "bg-red-500 border-red-500 text-white"
															: isRunning
																? "bg-blue-500 border-blue-500 text-white animate-pulse"
																: "bg-muted border-muted-foreground/30 text-muted-foreground"
												}`}
											>
												{isCompleted ? (
													<CheckCircle2 className="w-5 h-5" />
												) : isFailed ? (
													<XCircle className="w-5 h-5" />
												) : isRunning ? (
													<Loader2 className="w-5 h-5 animate-spin" />
												) : (
													<span className="text-sm font-medium">
														{index + 1}
													</span>
												)}
											</div>
											<span className="text-xs text-center max-w-[80px] leading-tight text-muted-foreground">
												{event.label.es}
											</span>
										</button>
									</HoverCardTrigger>
									<HoverCardContent
										side="top"
										align="center"
										sideOffset={8}
										className="w-72 p-0"
									>
										<div className="space-y-3 p-4">
											<h4 className="text-sm font-semibold">
												{event.label.es}
											</h4>
											<div className="space-y-2 text-sm">
												<div className="flex items-center justify-between rounded-md bg-muted p-2">
													<span className="text-muted-foreground">Estado</span>
													<div className="flex items-center gap-2">
														{getStatusIcon(event.state)}
														<span
															className={
																event.state === "SUCCESS"
																	? "text-green-600 font-medium"
																	: event.state === "FAILED"
																		? "text-red-600 font-medium"
																		: "text-blue-600 font-medium"
															}
														>
															{event.state}
														</span>
													</div>
												</div>
												<div className="flex items-center justify-between rounded-md bg-muted p-2">
													<span className="text-muted-foreground">Inicio</span>
													<span className="font-medium">
														{DayJS(event.created_at).fromNow()}
													</span>
												</div>
												<div className="flex items-center justify-between rounded-md bg-muted p-2">
													<span className="text-muted-foreground">
														Duración
													</span>
													<span className="font-medium">
														{formatDuration(event.created_at, event.updated_at)}
													</span>
												</div>
											</div>
										</div>
									</HoverCardContent>
								</HoverCard>

								{/* Connector Line - aligned with circle center */}
								{index < events.length - 1 && (
									<div className="mt-5">
										<div
											className={`h-0.5 w-8 shrink-0 mx-1 ${
												isCompleted
													? "bg-green-400"
													: isFailed
														? "bg-red-300"
														: "bg-muted-foreground/20"
											}`}
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
