import { SekiMonitor } from "@/components/SekiMonitor/SekiMonitor";
import type { SekiMonitorProps } from "@/components/SekiMonitor/types";

export function DeployPipelineCard(props: SekiMonitorProps) {
	return <SekiMonitor {...props} />;
}
