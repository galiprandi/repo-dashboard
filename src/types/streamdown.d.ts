declare module "streamdown" {
	import type { ReactNode } from "react";

	interface StreamdownProps {
		children: string;
		plugins?: Record<string, unknown>;
		className?: string;
	}

	export function Streamdown(props: StreamdownProps): ReactNode;
}
