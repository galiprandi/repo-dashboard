import type { ReactNode } from "react";

export type StageType = "staging" | "production";

export type MetaPart = {
	id: string;
	node: ReactNode;
};
