import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Loader2, Search, RefreshCw, X, ClipboardCopy, Check, Activity, Clock, RotateCcw, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useKubectlNamespaceAccess } from "@/hooks/useKubectlNamespaceAccess";
import { useAISummarize } from "@galiprandi/react-tools";
import { useAIErrorProcessor } from "@/hooks/useAIErrorProcessor";
import { getDeployments, getResourceLogs, getPodsForDeployment, getCurrentContext, getContexts } from "@/api/kubectl";
import { queryKeys, applyCachePolicy, invalidateByDomain } from "@/lib/queryKeys";
import { AISummaryCard } from "@/components/AISummaryCard";

interface K8sSectionProps {
	namespace: string;
}

export function K8sSection({ namespace }: K8sSectionProps) {
	const queryClient = useQueryClient();
	const [selectedContext, setSelectedContext] = useState<string | undefined>(undefined);
	const { data: access, isLoading: checkingAccess } = useKubectlNamespaceAccess(namespace, selectedContext || undefined);
	const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
	const [selectedPod, setSelectedPod] = useState<string | null>(null);
	const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
	const [logsResourceType, setLogsResourceType] = useState<"deployment" | "pod">("deployment");
	const [logsName, setLogsName] = useState<string>("");
	const [logTailSize, setLogTailSize] = useState<number>(100);

	// Use the auto-detected context if user hasn't manually selected one
	const activeContext = selectedContext || access?.validContext || undefined;

	if (checkingAccess) {
		return (
			<div className="border rounded-lg p-3 flex items-center gap-3 bg-muted/30">
				<Boxes className="w-5 h-5 text-blue-600 flex-shrink-0" />
				<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
				<span className="text-sm text-muted-foreground">
					{selectedContext 
						? `Obteniendo recursos de Kubernetes: ${selectedContext}`
						: "Obteniendo recursos de Kubernetes..."
					}
				</span>
			</div>
		);
	}

	if (!access?.hasAccess || !access.canGetDeployments) {
		console.log('[K8s] Kubernetes access not available for namespace:', namespace);
		return null;
	}
	console.log('[K8s] Kubernetes access available for namespace:', namespace);

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

	const handleContextChange = (newContext: string | undefined) => {
		setSelectedContext(newContext);
		setSelectedDeployment(null);
		setSelectedPod(null);
		// Invalidate all kubectl queries when context changes
		// Note: namespace-access is NOT invalidated here - TanStack Query handles it automatically
		// by creating a new query with the different context in the key
		invalidateByDomain(queryClient, "kubectl");
	};

	return (
		<>
			<div className="border rounded-lg p-3 flex items-center gap-3 bg-muted/30">
				<Boxes className="w-5 h-5 text-blue-600 flex-shrink-0" />

				<ContextDropdown
					selectedContext={selectedContext}
					onSelect={handleContextChange}
				/>
				
				<DeploymentDropdown
					namespace={namespace}
					context={activeContext}
					selectedDeployment={selectedDeployment}
					onSelect={(deployment) => {
						setSelectedDeployment(deployment);
						setSelectedPod(null);
					}}
				/>

				{selectedDeployment && <DeploymentStats namespace={namespace} context={activeContext} name={selectedDeployment} />}

				{selectedDeployment && (
					<PodDropdown
						namespace={namespace}
						context={activeContext}
						deploymentName={selectedDeployment}
						selectedPod={selectedPod}
						onSelect={setSelectedPod}
					/>
				)}

				{selectedDeployment && (
					<PodStats
						namespace={namespace}
						context={activeContext}
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
					context={activeContext}
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

function ContextDropdown({
	selectedContext,
	onSelect,
}: {
	selectedContext: string | undefined;
	onSelect: (context: string | undefined) => void;
}) {
	const { data: contexts, isLoading } = useQuery({
		queryKey: queryKeys.kubectl.contexts(),
		queryFn: async () => {
			const contexts = await getContexts();
			const current = await getCurrentContext();
			return { contexts, current };
		},
		refetchInterval: false,
		staleTime: Infinity,
		...applyCachePolicy("kubectl"),
	});

	const displayValue = selectedContext || contexts?.current || "";

	return (
		<select
			value={displayValue}
			onChange={(e) => onSelect(e.target.value || undefined)}
			disabled={isLoading || !contexts || contexts.contexts.length === 0}
			className="min-w-[180px] px-2 py-1 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
		>
			<option value="">Seleccionar contexto</option>
			{contexts?.contexts.map((ctx) => (
				<option key={ctx} value={ctx}>
					{ctx}
				</option>
			))}
		</select>
	);
}

function DeploymentDropdown({
	namespace,
	context,
	selectedDeployment,
	onSelect,
}: {
	namespace: string;
	context?: string;
	selectedDeployment: string | null;
	onSelect: (deployment: string | null) => void;
}) {
	const { data: deployments, isLoading } = useQuery({
		queryKey: queryKeys.kubectl.deployments(namespace, context),
		queryFn: () => getDeployments(namespace, context),
		refetchInterval: 30000,
		...applyCachePolicy("kubectl"),
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

function DeploymentStats({ namespace, context, name }: { namespace: string; context?: string; name: string }) {
	const { data: deployment, isLoading } = useQuery({
		queryKey: queryKeys.kubectl.deployment(namespace, name, context),
		queryFn: async () => {
			const deployments = await getDeployments(namespace, context);
			return deployments?.find((d) => d.name === name);
		},
		enabled: !!name,
		refetchInterval: 30000,
		...applyCachePolicy("kubectl"),
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
	context,
	deploymentName,
	selectedPod,
	onSelect,
}: {
	namespace: string;
	context?: string;
	deploymentName: string;
	selectedPod: string | null;
	onSelect: (pod: string | null) => void;
}) {
	const { data: pods, isLoading } = useQuery({
		queryKey: queryKeys.kubectl.pods(namespace, deploymentName, context),
		queryFn: () => getPodsForDeployment(deploymentName, namespace, context),
		enabled: !!deploymentName,
		refetchInterval: 30000,
		...applyCachePolicy("kubectl"),
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
	context,
	deploymentName,
	selectedPod,
	pods: podsProp,
}: {
	namespace: string;
	context?: string;
	deploymentName: string;
	selectedPod: string | null;
	pods?: Array<{ name: string; ready: string; status: string; restarts: string; age: string }>;
}) {
	const { data: podsQuery } = useQuery({
		queryKey: queryKeys.kubectl.pods(namespace, deploymentName, context),
		queryFn: () => getPodsForDeployment(deploymentName, namespace, context),
		enabled: !podsProp && !!deploymentName,
		refetchInterval: 30000,
		...applyCachePolicy("kubectl"),
	});

	const pods = podsProp || podsQuery;

	if (!pods || pods.length === 0) {
		return null;
	}

	const targetPod = selectedPod ? pods.find((p) => p.name === selectedPod) : null;

	if (targetPod) {
		// Stats de un pod específico
		return (
			<Tooltip.Provider>
				<div className="flex items-center gap-2 text-xs">
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<div className="flex items-center gap-1 text-muted-foreground cursor-help">
								<CheckCircle2 className="w-3.5 h-3.5" />
								<span>{targetPod.ready}</span>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
								sideOffset={5}
							>
								Contenedores listos / totales: {targetPod.ready}
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-help ${
									targetPod.status === "Running"
										? "bg-green-100 text-green-700"
										: targetPod.status === "Completed"
											? "bg-blue-100 text-blue-700"
											: targetPod.status === "Error"
												? "bg-red-100 text-red-700"
												: "bg-gray-100 text-gray-700"
								}`}
							>
								{targetPod.status}
							</span>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
								sideOffset={5}
							>
								Estado del pod: {targetPod.status}
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<div className="flex items-center gap-1 text-muted-foreground cursor-help">
								<RotateCcw className="w-3.5 h-3.5" />
								<span>{targetPod.restarts}</span>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
								sideOffset={5}
							>
								Reinicios del pod: {targetPod.restarts}
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<div className="flex items-center gap-1 text-muted-foreground cursor-help">
								<Clock className="w-3.5 h-3.5" />
								<span>{targetPod.age}</span>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
								sideOffset={5}
							>
								Tiempo desde creación: {targetPod.age}
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				</div>
			</Tooltip.Provider>
		);
	}

	// Stats de todos los pods
	const runningPods = pods.filter((p) => p.status === "Running").length;
	return (
		<Tooltip.Provider>
			<div className="flex items-center gap-2 text-xs">
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						<div className="flex items-center gap-1 text-muted-foreground cursor-help">
							<Activity className="w-3.5 h-3.5" />
							<span>{pods.length}</span>
						</div>
					</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content
							className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
							sideOffset={5}
						>
							Total de pods: {pods.length}
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						<div className="flex items-center gap-1 text-muted-foreground cursor-help">
							<CheckCircle2 className="w-3.5 h-3.5" />
							<span>{runningPods}</span>
						</div>
					</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content
							className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
							sideOffset={5}
						>
							Pods en ejecución: {runningPods}
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	);
}

// Patrón para detectar niveles de log (constante reutilizable)
const logLevelPattern = /\b(INFO|WARN|WARNING|ERROR|ERR|DEBUG|FATAL|TRACE)\b/gi;

function stripAnsiCodes(text: string): string {
	const esc = String.fromCharCode(0x1b);
	return text.replace(new RegExp(esc + '\\[[0-9;]*m', 'g'), "");
}

function highlightLogLine(line: string, filter?: string): React.ReactNode {
	if (!line) return line;

	// Limpiar ANSI color codes antes de resaltar
	let highlighted = stripAnsiCodes(line);

	// Patrón para timestamps (ej: 2024-04-30 10:00:00, Apr 30 10:00:00, etc.)
	const timestampPattern = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})|^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})|^(\d{2}:\d{2}:\d{2})/;

	// Patrón para niveles de log
	const logLevelPattern = /\b(INFO|WARN|WARNING|ERROR|ERR|DEBUG|FATAL|TRACE)\b/gi;

	// Reemplazar timestamps
	highlighted = highlighted.replace(timestampPattern, '<span class="text-blue-400">$&</span>');

	// Reemplazar niveles de log
	highlighted = highlighted.replace(logLevelPattern, (match) => {
		const level = match.toUpperCase();
		let colorClass = 'text-gray-400';
		if (level === 'ERROR' || level === 'ERR' || level === 'FATAL') {
			colorClass = 'text-red-400 font-bold';
		} else if (level === 'WARN' || level === 'WARNING') {
			colorClass = 'text-yellow-400 font-bold';
		} else if (level === 'INFO') {
			colorClass = 'text-green-400';
		} else if (level === 'DEBUG' || level === 'TRACE') {
			colorClass = 'text-purple-400';
		}
		return `<span class="${colorClass}">${match}</span>`;
	});

	// Resaltar término de búsqueda
	if (filter && filter.trim()) {
		const escapedFilter = filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const filterPattern = new RegExp(`(${escapedFilter})`, 'gi');
		highlighted = highlighted.replace(filterPattern, '<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">$1</mark>');
	}

	return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

function LogsModal({
	namespace,
	context,
	type,
	name,
	tailSize,
	onTailSizeChange,
	onClose,
}: {
	namespace: string;
	context?: string;
	type: "deployment" | "pod";
	name: string;
	tailSize: number;
	onTailSizeChange: (size: number) => void;
	onClose: () => void;
}) {
	const [currentName, setCurrentName] = useState(name);
	const [selectedPod, setSelectedPod] = useState<string | null>(type === "pod" ? name : null);
	const [autoFetch, setAutoFetch] = useState(true);

	const currentType = selectedPod ? "pod" : "deployment";

	const { data: logs, isLoading, refetch, error: logsError } = useQuery({
		queryKey: queryKeys.kubectl.logs(namespace, currentType, currentName, tailSize, context),
		queryFn: () => getResourceLogs(currentType, currentName, namespace, tailSize, context),
		refetchInterval: autoFetch ? 10000 : false,
		...applyCachePolicy("kubectl"),
	});

	// Obtener pods del deployment actual para el selector
	const { data: pods, error: podsError } = useQuery({
		queryKey: queryKeys.kubectl.pods(namespace, name, context),
		queryFn: () => getPodsForDeployment(name, namespace, context),
		enabled: !!name,
		...applyCachePolicy("kubectl"),
	});

	const [filter, setFilter] = useState("");
	const [logLevelFilter, setLogLevelFilter] = useState<"all" | "ERROR" | "WARN" | "INFO" | "DEBUG">("all");
	const [copied, setCopied] = useState(false);
	const [aiSummaryCopied, setAiSummaryCopied] = useState(false);
	const [isAiSummaryCollapsed, setIsAiSummaryCollapsed] = useState(false);
	const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
	const queryClient = useQueryClient();

	// Usar useAISummarize directo
	const { data, status, error: aiError, summarize, reset: resetAI } = useAISummarize({
		type: "key-points",
		format: "plain-text",
		length: "medium",
		outputLanguage: "es",
		streaming: true,
	});

	const availability = useMemo(() => 
		status === "initializing" || status === "downloading" ? "checking" :
		status === "idle" || status === "success" ? "available" : "unavailable",
		[status]
	);
	
	const isGenerating = isGeneratingLocal || status === "summarizing" || status === "initializing" || status === "downloading";
	const summary = data || "";

	const getStatusMessage = useMemo(() => {
		if (status === "initializing") return "Inicializando..."
		if (status === "downloading") return "Descargando..."
		if (status === "summarizing") return "Generando..."
		return "Generando..."
	}, [status]);

	const { processError } = useAIErrorProcessor();

	// Estado para errores kubectl procesados por AI
	const [kubectlError, setKubectlError] = useState<string | null>(null);

	// Manejar errores de queries con AI
	useEffect(() => {
		const handleQueryError = async (err: unknown) => {
			if (!err) return;
			const errorObj = err instanceof Error ? err : new Error(String(err));
			const friendlyError = await processError(errorObj);
			setKubectlError(friendlyError);
		};

		if (logsError) handleQueryError(logsError);
		if (podsError) handleQueryError(podsError);
	}, [logsError, podsError, processError]);

	// Agrupar líneas en logs completos (multi-línea)
	const groupLogs = (logText: string): string[] => {
		const lines = logText.split("\n");
		const logGroups: string[][] = [];
		let currentGroup: string[] = [];

		// Patrón para detectar inicio de nuevo log (timestamp o nivel de log)
		// Detecta: timestamps (2026-04-30), [Nest], [RedisBaseModel], JSON ({, "level":), o líneas que comienzan con texto después de ANSI codes
		const logStartPattern = (line: string): boolean => {
			const cleanLine = stripAnsiCodes(line);
			
			// Timestamp ISO (2026-04-30)
			if (/^\d{4}-\d{2}-\d{2}/.test(cleanLine)) return true;
			
			// JSON
			if (/^\{/.test(cleanLine) || /^"level":/.test(cleanLine)) return true;
			
			// Corchetes específicos de logs ([Nest], [RedisBaseModel], [Handler], etc.)
			if (/^\[Nest\]|\[RedisBaseModel\]|\[Handler\]|\[OnUserUpdated\]|\[FCMBase\]|\[PushNotificationStrategy\]|\[PushNotificationClient\]|\[Notifier\]/.test(cleanLine)) return true;
			
			// kafka-client logs (info:, silly:, error:)
			if (/^info:|^silly:|^error:|^warn:/.test(cleanLine)) return true;
			
			return false;
		};

		for (const line of lines) {
			if (logStartPattern(line)) {
				// Inicio de nuevo log
				if (currentGroup.length > 0) {
					logGroups.push(currentGroup);
				}
				currentGroup = [line];
			} else {
				// Continuación del log actual
				currentGroup.push(line);
			}
		}
		if (currentGroup.length > 0) {
			logGroups.push(currentGroup);
		}

		return logGroups.map(group => group.join("\n"));
	};

	const filteredLines = useMemo(() => {
		if (!logs) return [];

		const trimmedLogs = logs.trimEnd();
		const logGroups = groupLogs(trimmedLogs).reverse();

		// Filtrar por nivel de log si está seleccionado
		let groupsToProcess = logGroups;
		if (logLevelFilter !== "all") {
			groupsToProcess = logGroups.filter(group => {
				const match = group.match(logLevelPattern);
				if (!match) return false;
				const level = match[0].toUpperCase();
				if (logLevelFilter === "ERROR") {
					return level === "ERROR" || level === "ERR" || level === "FATAL";
				}
				if (logLevelFilter === "WARN") {
					return level === "WARN" || level === "WARNING";
				}
				return level === logLevelFilter;
			});
		}

		if (filter === "") {
			return groupsToProcess.flatMap(group => group.split("\n"));
		}

		const filterLower = filter.toLowerCase();

		// Filtrar grupos que coinciden con el filtro
		const matchingGroups = groupsToProcess.filter(group =>
			group.toLowerCase().includes(filterLower)
		);

		// Convertir grupos filtrados de vuelta a líneas individuales
		return matchingGroups.flatMap(group => group.split("\n"));
	}, [logs, filter, logLevelFilter]);

	const handleCopy = async () => {
		const logsToCopy = filteredLines.join('\n');
		if (!logsToCopy) return;
		await navigator.clipboard.writeText(logsToCopy);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleCopyAiSummary = async () => {
		if (!summary) return;
		await navigator.clipboard.writeText(summary);
		setAiSummaryCopied(true);
		setTimeout(() => setAiSummaryCopied(false), 2000);
	};

	const handlePodChange = (podName: string) => {
		if (podName === "") {
			// Si se selecciona "Todos los pods", volver al deployment
			setCurrentName(name);
			setSelectedPod(null);
		} else {
			setCurrentName(podName);
			setSelectedPod(podName);
		}
	};

	const handleSummarizeWithAI = async () => {
		if (!logs) return;

		const logsToSummarize = filteredLines.join('\n');
		const context = 'Analiza los logs SOLO para identificar problemas. Si los logs están en formato JSON, extrae el mensaje de error y el nivel (level). REGLAS ESTRICTAS: 1) NO repitas los logs completos o en JSON, 2) NO menciones configuración, rutas, startup, Swagger, mapeo de controladores, debug info, 3) Solo reporta ERRORES, WARNINGS, EXCEPCIONES, TIMEOUTS, FALLOS DE CONEXIÓN en lenguaje natural, 4) Compliance: secretos expuestos, credenciales en texto plano. ESTRUCTURA EXACTA (máximo 4 líneas, texto plano): * Errores críticos: [descripción en lenguaje natural o "ninguno"] * Warnings: [descripción en lenguaje natural o "ninguno"] * Compliance: [problemas o "ninguno"] * Estado general: HEALTHY/DEGRADED/CRITICAL. NO agregues secciones adicionales. Usa minúsculas en las etiquetas.';
		const textWithContext = `INSTRUCCIÓN: ${context}\n\n${logsToSummarize}`;
		const queryKey = ['ai-summary', logsToSummarize, context];

		setIsGeneratingLocal(true);

		try {
			const cachedData = queryClient.getQueryData<string>(queryKey);
			if (cachedData) return;

			await queryClient.fetchQuery({
				queryKey,
				queryFn: async () => {
					await summarize(textWithContext, context);
					return new Promise<string>((resolve) => {
						const checkData = () => {
							if (data) resolve(data);
							else setTimeout(checkData, 50);
						};
						checkData();
					});
				},
				staleTime: 5 * 60 * 1000,
				gcTime: 10 * 60 * 1000,
			});
		} catch (err) {
			console.error('[K8sSection] Error generating summary:', err);
		} finally {
			setIsGeneratingLocal(false);
		}
		setKubectlError(null);
	};

	const handleRegenerateSummary = async () => {
		queryClient.removeQueries({ queryKey: ['ai-summary'] });
		resetAI();
		await handleSummarizeWithAI();
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-background rounded-lg shadow-lg w-[90vw] h-[90vh] max-w-[1800px] flex flex-col overflow-hidden">
				<Tooltip.Provider>
					<div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold">Logs: {currentName}</h3>
							{pods && (
								<select
									value={selectedPod || ""}
									onChange={(e) => handlePodChange(e.target.value)}
									className="bg-background border rounded px-2 py-1 text-sm"
								>
									<option value="">Todos los pods</option>
									{pods.map((pod) => (
										<option key={pod.name} value={pod.name}>
											{pod.name}
										</option>
									))}
								</select>
							)}
							{pods && (
								<PodStats
									namespace={namespace}
									context={context}
									deploymentName={name}
									selectedPod={selectedPod}
									pods={pods}
								/>
							)}
						</div>
						<div className="flex items-center gap-2">
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<button
									type="button"
									onClick={handleSummarizeWithAI}
									disabled={isGenerating || availability !== "available" || !logs}
									className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
									{isGenerating ? getStatusMessage : "Resumir"}
								</button>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									Resumir logs con IA
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<div className="relative">
									<Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
									<input
										type="text"
										value={filter}
										onChange={(e) => setFilter(e.target.value)}
										placeholder=""
										className="pl-7 pr-2 py-1 text-sm bg-background border rounded w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									Filtrar logs por texto
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<select
									value={logLevelFilter}
									onChange={(e) => setLogLevelFilter(e.target.value as "all" | "ERROR" | "WARN" | "INFO" | "DEBUG")}
									className="bg-background border rounded px-2 py-1 text-sm"
								>
									<option value="all">Todos</option>
									<option value="ERROR">ERROR</option>
									<option value="WARN">WARN</option>
									<option value="INFO">INFO</option>
									<option value="DEBUG">DEBUG</option>
								</select>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									Filtrar por nivel de log
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<select
									value={tailSize}
									onChange={(e) => onTailSizeChange(Number(e.target.value))}
									className="bg-background border rounded px-2 py-1 text-sm"
								>
									<option value={50}>50</option>
									<option value={100}>100</option>
									<option value={500}>500</option>
									<option value={1000}>1000</option>
								</select>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									Número de líneas a mostrar
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<button
									type="button"
									onClick={() => setAutoFetch(!autoFetch)}
									className={`p-1.5 rounded transition-colors ${autoFetch ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
								>
									<Clock className={`w-4 h-4 ${autoFetch ? 'animate-pulse' : ''}`} />
								</button>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									{autoFetch ? "Desactivar auto-recarga (10s)" : "Activar auto-recarga (10s)"}
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<div className="w-px h-6 bg-border mx-2" />
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<span className="text-xs text-muted-foreground cursor-help">
									{filteredLines.length} logs
								</span>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									Logs mostrados (con filtros aplicados)
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<div className="flex-1" />
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<button
									type="button"
									onClick={() => refetch()}
									className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
								>
									<RefreshCw className="w-4 h-4" />
								</button>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									Recargar logs manualmente
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<button
									type="button"
									onClick={handleCopy}
									className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
								>
									{copied ? <Check className="w-4 h-4 text-green-500" /> : <ClipboardCopy className="w-4 h-4" />}
								</button>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									{copied ? "¡Copiado!" : "Copiar logs al portapapeles"}
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<button
									type="button"
									onClick={onClose}
									className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 text-xs rounded-md shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50"
									sideOffset={5}
								>
									Cerrar modal de logs
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
					</div>
				</div>
				</Tooltip.Provider>
				<div className="flex-1 overflow-auto bg-black text-green-400 p-4 font-mono text-xs">
					{kubectlError && (
						<div className="mb-4 p-3 bg-red-900 border border-red-500/30 rounded-lg sticky top-0 z-10">
							<div className="flex items-center justify-between gap-2 mb-2">
								<div className="flex items-center gap-2">
									<AlertCircle className="w-4 h-4 text-red-400" />
									<span className="text-red-300 font-semibold text-sm">Error</span>
								</div>
								<button
									onClick={() => setKubectlError(null)}
									className="text-xs text-red-300 hover:text-red-200 hover:bg-red-800/30 rounded px-2 py-1 transition-colors"
								>
									<X className="w-3 h-3" />
								</button>
							</div>
							<p className="text-red-100 text-xs whitespace-pre-wrap">{kubectlError}</p>
						</div>
					)}
					<AISummaryCard
						summary={summary}
						isGenerating={isGenerating}
						error={aiError?.message || null}
						onRegenerate={handleRegenerateSummary}
						onCopy={handleCopyAiSummary}
						isCollapsed={isAiSummaryCollapsed}
						onToggleCollapse={() => setIsAiSummaryCollapsed(!isAiSummaryCollapsed)}
						isCopied={aiSummaryCopied}
						variant="compact"
					/>
					{isLoading ? (
						<div className="flex items-center justify-center gap-2 h-full text-gray-400">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Cargando logs...</span>
						</div>
					) : (
						<pre
							className="whitespace-pre-wrap break-words"
						>
							{filteredLines.length > 0
								? filteredLines.map((line, idx) => (
									<div key={idx}>{highlightLogLine(line, filter)}</div>
								))
								: (filter || logLevelFilter !== "all")
									? <span className="text-gray-500">No se encontraron logs que coincidan con los filtros.</span>
									: (logs || "No logs disponibles")
							}
						</pre>
					)}
				</div>
			</div>
		</div>
	);
}

