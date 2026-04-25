import type { StageType } from "./types";

export const stageStyles: Record<StageType, { badge: string; accent: string }> = {
	production: {
		badge: "bg-purple-50 text-purple-700 border border-purple-100",
		accent: "bg-purple-500",
	},
	staging: {
		badge: "bg-blue-50 text-blue-600 border border-blue-100",
		accent: "bg-blue-500",
	},
};
