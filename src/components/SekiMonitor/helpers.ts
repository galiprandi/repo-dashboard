import type { Event } from "@/api/seki.type";
import { stageStyles } from "@/components/pipeline/helpers";

export { stageStyles };

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
				!line.startsWith("**Environment") &&
				!line.startsWith("This event") &&
				!line.startsWith("This task") &&
				!line.startsWith("The deploy of") &&
				!line.startsWith("The build of") &&
				!line.includes("more details below"),
		);
	const summary = lines[0] ?? "Sin detalle adicional.";
	// Remove inline markdown formatting (bold, italic, code)
	return summary
		.replace(/\*\*/g, "")
		.replace(/\*/g, "")
		.replace(/`/g, "")
		.replace(/__/g, "")
		.replace(/_/g, "");
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
