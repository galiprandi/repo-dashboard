import { useQuery } from "@tanstack/react-query";
import { runCommand } from "@/api/exec";

export interface KubectlNamespaceAccess {
	canGetPods: boolean;
	canGetDeployments: boolean;
	canGetPodLogs: boolean;
	hasAccess: boolean;
}

export function useKubectlNamespaceAccess(namespace: string | null) {
	return useQuery({
		queryKey: ["kubectl", "namespace-access", namespace],
		queryFn: async (): Promise<KubectlNamespaceAccess> => {
			if (!namespace) {
				return {
					canGetPods: false,
					canGetDeployments: false,
					canGetPodLogs: false,
					hasAccess: false,
				};
			}

			try {
				const [podsResult, deploymentsResult, logsResult] = await Promise.allSettled([
					runCommand(`kubectl auth can-i get pods -n ${namespace}`),
					runCommand(`kubectl auth can-i get deployments -n ${namespace}`),
					runCommand(`kubectl auth can-i get pods/logs -n ${namespace}`),
				]);

				const canGetPods = podsResult.status === "fulfilled" && podsResult.value.stdout.trim() === "yes";
				const canGetDeployments = deploymentsResult.status === "fulfilled" && deploymentsResult.value.stdout.trim() === "yes";
				const canGetPodLogs = logsResult.status === "fulfilled" && logsResult.value.stdout.trim() === "yes";
				const hasAccess = canGetPods || canGetDeployments || canGetPodLogs;

				return {
					canGetPods,
					canGetDeployments,
					canGetPodLogs,
					hasAccess,
				};
			} catch {
				return {
					canGetPods: false,
					canGetDeployments: false,
					canGetPodLogs: false,
					hasAccess: false,
				};
			}
		},
		enabled: !!namespace,
		retry: false,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}
