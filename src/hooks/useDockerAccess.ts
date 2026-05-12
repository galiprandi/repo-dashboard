import { useQuery } from "@tanstack/react-query";
import { checkDockerInstalled, checkDockerAccess } from "@/api/docker";
import { queryKeys, applyCachePolicy } from "@/lib/queryKeys";

export interface DockerAccess {
	hasAccess: boolean;
	isInstalled: boolean;
}

export function useDockerAccess() {
	return useQuery({
		queryKey: queryKeys.docker.access(),
		queryFn: async (): Promise<DockerAccess> => {
			// Verificar que Docker esté instalado
			const isInstalled = await checkDockerInstalled();
			if (!isInstalled) {
				return {
					hasAccess: false,
					isInstalled: false,
				};
			}

			// Verificar que el usuario tenga acceso a Docker
			const hasAccess = await checkDockerAccess();

			return {
				hasAccess,
				isInstalled: true,
			};
		},
		...applyCachePolicy("docker"),
	});
}
