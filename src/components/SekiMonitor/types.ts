import type { PipelineStatusResponse } from "@/api/seki.type";
import type { StageType, MetaPart } from "@/components/pipeline/types";

export interface SekiMonitorProps {
	pipeline?: PipelineStatusResponse;
	stage: StageType;
	gitDate?: string; // Fecha del commit/tag para consistencia con la tabla
	isLoading?: boolean;
	error?: Error | null;
}

export type { MetaPart };
