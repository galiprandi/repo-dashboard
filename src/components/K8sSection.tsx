import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Loader2, Search, RefreshCw, X, ClipboardCopy, Check, Activity, Clock, RotateCcw, CheckCircle2 } from "lucide-react";
import { useKubectlNamespaceAccess } from "@/hooks/useKubectlNamespaceAccess";
import { getDeployments, getResourceLogs, getPodsForDeployment } from "@/api/kubectl";

interface K8sSectionProps {
	namespace: string;
}

export function K8sSection({ namespace }: K8sSectionProps) {
	const { data: access, isLoading: checkingAccess } = useKubectlNamespaceAccess(namespace);
	const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
	const [selectedPod, setSelectedPod] = useState<string | null>(null);
	const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
	const [logsResourceType, setLogsResourceType] = useState<"deployment" | "pod">("deployment");
	const [logsName, setLogsName] = useState<string>("");
	const [logTailSize, setLogTailSize] = useState<number>(100);

	if (checkingAccess) {
		return (
			<div className="border rounded-lg p-4 flex items-center justify-center gap-2 text-muted-foreground">
				<Loader2 className="w-4 h-4 animate-spin" />
				<span>Verificando acceso a Kubernetes...</span>
			</div>
		);
	}

	if (!access?.hasAccess || !access.canGetDeployments) {
		return null;
	}

	const handleViewDeploymentLogs = (deploymentName: string) => {
		setLogsResourceType("deployment");
		setLogsName(deploymentName);
		setIsLogsModalOpen(true);
	};

	const handleViewPodLogs = (podName: string) => {
		setLogsResourceType("pod");
		setLogsName(podName);
		setIsLogsModalOpen(true);
	};

	return (
		<>
			<div className="border rounded-lg p-3 flex items-center gap-3 bg-muted/30">
				<Boxes className="w-5 h-5 text-blue-600 flex-shrink-0" />
				
				<DeploymentDropdown
					namespace={namespace}
					selectedDeployment={selectedDeployment}
					onSelect={(deployment) => {
						setSelectedDeployment(deployment);
						setSelectedPod(null);
					}}
				/>

				{selectedDeployment && <DeploymentStats namespace={namespace} name={selectedDeployment} />}

				{selectedDeployment && (
					<PodDropdown
						namespace={namespace}
						deploymentName={selectedDeployment}
						selectedPod={selectedPod}
						onSelect={setSelectedPod}
					/>
				)}

				{selectedDeployment && (
					<PodStats
						namespace={namespace}
						deploymentName={selectedDeployment}
						selectedPod={selectedPod}
					/>
				)}

				<div className="flex-1" />

				{selectedDeployment && !selectedPod && (
					<button
						type="button"
						onClick={() => handleViewDeploymentLogs(selectedDeployment)}
						className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
					>
						<Search className="w-3.5 h-3.5" />
						Logs
					</button>
				)}

				{selectedPod && (
					<button
						type="button"
						onClick={() => handleViewPodLogs(selectedPod)}
						className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
					>
						<Search className="w-3.5 h-3.5" />
						Logs
					</button>
				)}
			</div>

			{isLogsModalOpen && (
				<LogsModal
					namespace={namespace}
					type={logsResourceType}
					name={logsName}
					tailSize={logTailSize}
					onTailSizeChange={setLogTailSize}
					onClose={() => setIsLogsModalOpen(false)}
				/>
			)}
		</>
	);
}

function DeploymentDropdown({
	namespace,
	selectedDeployment,
	onSelect,
}: {
	namespace: string;
	selectedDeployment: string | null;
	onSelect: (deployment: string | null) => void;
}) {
	const { data: deployments, isLoading } = useQuery({
		queryKey: ["kubectl", "deployments", namespace],
		queryFn: () => getDeployments(namespace),
		refetchInterval: 30000,
	});

	return (
		<select
			value={selectedDeployment || ""}
			onChange={(e) => onSelect(e.target.value || null)}
			disabled={isLoading || !deployments || deployments.length === 0}
			className="min-w-[200px] px-2 py-1 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
		>
			<option value="">Seleccionar deployment</option>
			{deployments?.map((deployment) => (
				<option key={deployment.name} value={deployment.name}>
					{deployment.name}
				</option>
			))}
		</select>
	);
}

function DeploymentStats({ namespace, name }: { namespace: string; name: string }) {
	const { data: deployment, isLoading } = useQuery({
		queryKey: ["kubectl", "deployment", namespace, name],
		queryFn: async () => {
			const deployments = await getDeployments(namespace);
			return deployments?.find((d) => d.name === name);
		},
		enabled: !!name,
		refetchInterval: 30000,
	});

	if (isLoading || !deployment) {
		return <div className="text-xs text-muted-foreground">Cargando...</div>;
	}

	return (
		<div className="flex items-center gap-2 text-xs">
			<div className="flex items-center gap-1 text-muted-foreground" title={`Pods listos / Pods deseados: ${deployment.ready}`}>
				<CheckCircle2 className="w-3.5 h-3.5" />
				<span>{deployment.ready}</span>
			</div>
			<div className="flex items-center gap-1 text-muted-foreground" title={`Replicas actualizadas: ${deployment.upToDate}`}>
				<Activity className="w-3.5 h-3.5" />
				<span>{deployment.upToDate}</span>
			</div>
			<div className="flex items-center gap-1 text-muted-foreground" title={`Replicas disponibles: ${deployment.available}`}>
				<CheckCircle2 className="w-3.5 h-3.5" />
				<span>{deployment.available}</span>
			</div>
			<div className="flex items-center gap-1 text-muted-foreground" title={`Tiempo desde creación: ${deployment.age}`}>
				<Clock className="w-3.5 h-3.5" />
				<span>{deployment.age}</span>
			</div>
		</div>
	);
}

function PodDropdown({
	namespace,
	deploymentName,
	selectedPod,
	onSelect,
}: {
	namespace: string;
	deploymentName: string;
	selectedPod: string | null;
	onSelect: (pod: string | null) => void;
}) {
	const { data: pods, isLoading } = useQuery({
		queryKey: ["kubectl", "deployment-pods", namespace, deploymentName],
		queryFn: () => getPodsForDeployment(deploymentName, namespace),
		enabled: !!deploymentName,
		refetchInterval: 30000,
	});

	return (
		<select
			value={selectedPod || ""}
			onChange={(e) => onSelect(e.target.value || null)}
			disabled={isLoading || !pods || pods.length === 0}
			className="min-w-[200px] px-2 py-1 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
		>
			<option value="">Todos los pods</option>
			{pods?.map((pod) => (
				<option key={pod.name} value={pod.name}>
					{pod.name}
				</option>
			))}
		</select>
	);
}

function PodStats({
	namespace,
	deploymentName,
	selectedPod,
}: {
	namespace: string;
	deploymentName: string;
	selectedPod: string | null;
}) {
	const { data: pods } = useQuery({
		queryKey: ["kubectl", "deployment-pods", namespace, deploymentName],
		queryFn: () => getPodsForDeployment(deploymentName, namespace),
		enabled: !!deploymentName,
		refetchInterval: 30000,
	});

	if (!pods || pods.length === 0) {
		return null;
	}

	const targetPod = selectedPod ? pods.find((p) => p.name === selectedPod) : null;

	if (targetPod) {
		// Stats de un pod específico
		return (
			<div className="flex items-center gap-2 text-xs">
				<div className="flex items-center gap-1 text-muted-foreground" title={`Contenedores listos / totales: ${targetPod.ready}`}>
					<CheckCircle2 className="w-3.5 h-3.5" />
					<span>{targetPod.ready}</span>
				</div>
				<span
					className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
						targetPod.status === "Running"
							? "bg-green-100 text-green-700"
							: targetPod.status === "Completed"
								? "bg-blue-100 text-blue-700"
								: targetPod.status === "Error"
									? "bg-red-100 text-red-700"
									: "bg-gray-100 text-gray-700"
					}`}
					title={`Estado del pod: ${targetPod.status}`}
				>
					{targetPod.status}
				</span>
				<div className="flex items-center gap-1 text-muted-foreground" title={`Reinicios del pod: ${targetPod.restarts}`}>
					<RotateCcw className="w-3.5 h-3.5" />
					<span>{targetPod.restarts}</span>
				</div>
				<div className="flex items-center gap-1 text-muted-foreground" title={`Tiempo desde creación: ${targetPod.age}`}>
					<Clock className="w-3.5 h-3.5" />
					<span>{targetPod.age}</span>
				</div>
			</div>
		);
	}

	// Stats de todos los pods
	const runningPods = pods.filter((p) => p.status === "Running").length;
	return (
		<div className="flex items-center gap-2 text-xs">
			<div className="flex items-center gap-1 text-muted-foreground" title={`Total de pods: ${pods.length}`}>
				<Activity className="w-3.5 h-3.5" />
				<span>{pods.length}</span>
			</div>
			<div className="flex items-center gap-1 text-muted-foreground" title={`Pods en ejecución: ${runningPods}`}>
				<CheckCircle2 className="w-3.5 h-3.5" />
				<span>{runningPods}</span>
			</div>
		</div>
	);
}

function LogsModal({
	namespace,
	type,
	name,
	tailSize,
	onTailSizeChange,
	onClose,
}: {
	namespace: string;
	type: "deployment" | "pod";
	name: string;
	tailSize: number;
	onTailSizeChange: (size: number) => void;
	onClose: () => void;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [copied, setCopied] = useState(false);
	const { data: logs, isLoading, refetch } = useQuery({
		queryKey: ["kubectl", "logs", type, namespace, name, tailSize],
		queryFn: () => getResourceLogs(type, name, namespace, tailSize),
		enabled: !!namespace && !!name,
	});

	const filteredLines = logs
		? logs.split("\n").filter((line) => searchQuery === "" || line.toLowerCase().includes(searchQuery.toLowerCase()))
		: [];

	const handleCopy = async () => {
		if (!logs) return;
		await navigator.clipboard.writeText(logs);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
				<div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold">Logs: {name}</h3>
						<span className="text-xs text-muted-foreground">({type})</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Filtrar logs..."
								className="pl-7 pr-2 py-1 text-sm bg-background border rounded-md w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<select
							value={tailSize}
							onChange={(e) => onTailSizeChange(Number(e.target.value))}
							className="bg-background border rounded px-2 py-1 text-sm"
						>
							<option value={50}>50 líneas</option>
							<option value={100}>100 líneas</option>
							<option value={500}>500 líneas</option>
							<option value={1000}>1000 líneas</option>
						</select>
						<button
							type="button"
							onClick={() => refetch()}
							className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
							title="Recargar"
						>
							<RefreshCw className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={handleCopy}
							className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
							title={copied ? "Copiado!" : "Copiar logs"}
						>
							{copied ? <Check className="w-4 h-4 text-green-500" /> : <ClipboardCopy className="w-4 h-4" />}
						</button>
						<button
							type="button"
							onClick={onClose}
							className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
							title="Cerrar"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
				<div className="flex-1 overflow-auto bg-black text-green-400 p-4 font-mono text-xs">
					{isLoading ? (
						<div className="flex items-center justify-center gap-2 h-full text-gray-400">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Cargando logs...</span>
						</div>
					) : (
						<pre className="whitespace-pre-wrap break-words">{filteredLines.length > 0 ? filteredLines.join("\n") : (logs || "No logs disponibles")}</pre>
					)}
				</div>
			</div>
		</div>
	);
}

