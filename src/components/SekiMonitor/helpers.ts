import type { Event } from "@/api/seki.type";
import { stageStyles } from "@/components/pipeline/helpers";

export { stageStyles };

const ROUTE_REGEX = /(https?:\/\/[^\s<>"')]+)/gi;

/**
 * Limpia una URL extraída de markdown, removiendo tags HTML y caracteres no deseados
 */
const cleanUrl = (url: string): string => {
	// Remover tags HTML comunes que pueden quedar al final de la URL
	return url
		.replace(/<\/[^>]+>$/g, '') // Remover </tag> al final
		.replace(/<[^>]+>$/g, '')  // Remover <tag> al final
		.replace(/"$/, '');        // Remover comillas al final
};

/**
 * Verifica si una URL es externa (accesible desde el navegador)
 * Las URLs internas tipo *.svc.cluster.local no son accesibles desde fuera del cluster
 */
const isExternalUrl = (url: string): boolean => {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname;

		// Filtrar URLs internas de Kubernetes
		if (hostname.includes('.svc.cluster.local')) {
			return false;
		}

		// Filtrar URLs internas de servicios mesh/istio
		if (hostname.includes('.svc.') || hostname.endsWith('.local')) {
			return false;
		}

		return true;
	} catch {
		return false;
	}
};

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
			if (sub.markdown) {
				const matches = sub.markdown.match(ROUTE_REGEX);
				if (matches) {
					matches.forEach((match) => {
						const url = cleanUrl(match);
						// Solo incluir URLs externas accesibles desde el navegador
						if (isExternalUrl(url)) {
							urls.add(url);
						}
					});
				}
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
