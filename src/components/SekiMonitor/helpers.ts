import type { Event } from "@/api/seki.type";
import type { StageType } from "@/components/SekiMonitor/types";

export const stageStyles: Record<StageType, { badge: string; accent: string }> =
	{
		production: {
			badge: "bg-purple-50 text-purple-700 border border-purple-100",
			accent: "bg-purple-500",
		},
		staging: {
			badge: "bg-blue-50 text-blue-600 border border-blue-100",
			accent: "bg-blue-500",
		},
	};

const ROUTE_REGEX = /(https?:\/\/[^\s<>"')]+)/gi;

export interface FlattenedSubEvent {
	parent: Event;
	sub: Event["subevents"][number];
}

export const flattenSubEvents = (events: Event[]): FlattenedSubEvent[] =>
	events.flatMap((event) =>
		event.subevents.map((sub) => ({
			parent: event,
			sub,
		})),
	);

export const extractSummary = (markdown: string) => {
	if (!markdown) return "Sin detalle adicional.";
	const lines = markdown
		.replace(/```[\s\S]*?```/g, "")
		.split("\n")
		.map((line) => line.trim())
		.filter(
			(line) =>
				line &&
				!line.startsWith("#") &&
				!line.startsWith("**Product") &&
				!line.startsWith("**Commit") &&
				!line.startsWith("**Environment"),
		);
	return lines[0] ?? "Sin detalle adicional.";
};

export const extractRoutes = (events: Event[]) => {
	const urls = new Set<string>();
	flattenSubEvents(events)
		.filter(({ sub }) => sub.id.toUpperCase().startsWith("DEPLOY"))
		.forEach(({ sub }) => {
			const matches = sub.markdown.match(ROUTE_REGEX);
			if (matches) {
				matches.forEach((match) => {
					urls.add(match.replace(/"$/, ""));
				});
			}
		});
	return Array.from(urls);
};

export const severityRank = (state: string) => {
	switch (state) {
		case "FAILED":
			return 1;
		case "RUNNING":
		case "PENDING":
			return 2;
		case "WARN":
			return 3;
		default:
			return 4;
	}
};
