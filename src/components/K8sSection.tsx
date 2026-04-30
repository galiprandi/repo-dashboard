import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Loader2, Search, RefreshCw, X, ClipboardCopy, Check, Activity, Clock, RotateCcw, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useKubectlNamespaceAccess } from "@/hooks/useKubectlNamespaceAccess";
import { useAISummarizer } from "@/hooks/useAISummarizer";
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

function highlightLogLine(line: string): React.ReactNode {
	if (!line) return line;

	// Patrón para timestamps (ej: 2024-04-30 10:00:00, Apr 30 10:00:00, etc.)
	const timestampPattern = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})|^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})|^(\d{2}:\d{2}:\d{2})/;
	
	// Patrón para niveles de log
	const logLevelPattern = /\b(INFO|WARN|WARNING|ERROR|ERR|DEBUG|FATAL|TRACE)\b/gi;

	// Reemplazar timestamps
	let highlighted = line.replace(timestampPattern, '<span class="text-blue-400">$&</span>');

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

	return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
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
	const [currentType, setCurrentType] = useState<"deployment" | "pod">(type);
	const [currentName, setCurrentName] = useState(name);
	const [selectedPod, setSelectedPod] = useState<string | null>(type === "pod" ? name : null);

	const { data: logs, isLoading, refetch } = useQuery({
		queryKey: ["kubectl", "logs", currentType, namespace, currentName, tailSize],
		queryFn: () => getResourceLogs(currentType, currentName, namespace, tailSize),
		refetchInterval: 10000,
	});

	// Obtener pods del deployment actual para el selector
	const { data: pods } = useQuery({
		queryKey: ["kubectl", "pods", namespace, currentType === "deployment" ? currentName : ""],
		queryFn: () => getPodsForDeployment(currentName, namespace),
		enabled: currentType === "deployment",
	});

	const [filter, setFilter] = useState("");
	const [copied, setCopied] = useState(false);
	const [aiSummaryCopied, setAiSummaryCopied] = useState(false);
	const [isAiSummaryCollapsed, setIsAiSummaryCollapsed] = useState(false);

	// Usar hook de AI Summarizer
	const { availability, isGenerating, summary, error: aiError, generate: generateAISummary } = useAISummarizer();

	// Agrupar líneas en logs completos (multi-línea)
	const groupLogs = (logText: string): string[] => {
		const lines = logText.split("\n");
		const logGroups: string[][] = [];
		let currentGroup: string[] = [];

		// Función para remover ANSI color codes
		const stripAnsi = (text: string): string => {
			return text.replace(/\u001b\[[0-9;]*m/g, "");
		};

		// Patrón para detectar inicio de nuevo log (timestamp o nivel de log)
		// Detecta: timestamps (2026-04-30), [Nest], [RedisBaseModel], JSON ({, "level":), o líneas que comienzan con texto después de ANSI codes
		const logStartPattern = (line: string): boolean => {
			const cleanLine = stripAnsi(line);
			
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

	const filteredLines = (() => {
		if (!logs || filter === "") {
			return logs ? logs.split("\n") : [];
		}

		// Agrupar logs y filtrar por log completo
		const logGroups = groupLogs(logs);
		const filterLower = filter.toLowerCase();

		// Filtrar grupos que coinciden con el filtro
		const matchingGroups = logGroups.filter(group =>
			group.toLowerCase().includes(filterLower)
		);

		// Convertir grupos filtrados de vuelta a líneas individuales
		return matchingGroups.flatMap(group => group.split("\n"));
	})();

	const handleCopy = async () => {
		const logsToCopy = filter.length > 0 ? filteredLines.join('\n') : logs;
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

	const handleTypeChange = (newType: "deployment" | "pod") => {
		setCurrentType(newType);
		if (newType === "deployment") {
			setCurrentName(name); // Volver al deployment original
			setSelectedPod(null);
		} else {
			// Si cambiamos a pod, seleccionar el primer pod disponible
			if (pods && pods.length > 0) {
				const firstPod = pods[0].name;
				setCurrentName(firstPod);
				setSelectedPod(firstPod);
			}
		}
	};

	const handlePodChange = (podName: string) => {
		setCurrentName(podName);
		setSelectedPod(podName);
	};

	const handleSummarizeWithAI = async () => {
		if (!logs) return;
		
		// Usar logs filtrados si hay filtro activo, si no usar todos los logs
		const logsToSummarize = filter.length > 0 ? filteredLines.join('\n') : logs;

		// Generar resumen con el hook
		await generateAISummary(logsToSummarize, {
			type: 'key-points',
			context: 'Analiza los logs SOLO para identificar problemas. Si los logs están en formato JSON, extrae el mensaje de error y el nivel (level). REGLAS ESTRICTAS: 1) NO repitas los logs completos o en JSON, 2) NO menciones configuración, rutas, startup, Swagger, mapeo de controladores, debug info, 3) Solo reporta ERRORES, WARNINGS, EXCEPCIONES, TIMEOUTS, FALLOS DE CONEXIÓN en lenguaje natural, 4) Compliance: secretos expuestos, credenciales en texto plano. ESTRUCTURA EXACTA (máximo 4 líneas, texto plano): * Errores críticos: [descripción en lenguaje natural o "ninguno"] * Warnings: [descripción en lenguaje natural o "ninguno"] * Compliance: [problemas o "ninguno"] * Estado general: HEALTHY/DEGRADED/CRITICAL. NO agregues secciones adicionales. Usa minúsculas en las etiquetas.',
			maxLines: 200,
			maxChars: 10000,
		});
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-background rounded-lg shadow-lg w-[90vw] h-[90vh] max-w-[1800px] flex flex-col overflow-hidden">
				<div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold">Logs: {currentName}</h3>
						<select
							value={currentType}
							onChange={(e) => handleTypeChange(e.target.value as "deployment" | "pod")}
							className="bg-background border rounded px-2 py-1 text-sm"
						>
							<option value="deployment">Todos los pods</option>
							<option value="pod">Pod específico</option>
						</select>
						{currentType === "pod" && pods && (
							<select
								value={selectedPod || ""}
								onChange={(e) => handlePodChange(e.target.value)}
								className="bg-background border rounded px-2 py-1 text-sm"
							>
								{pods.map((pod) => (
									<option key={pod.name} value={pod.name}>
										{pod.name}
									</option>
								))}
							</select>
						)}
						<span className="text-xs text-muted-foreground">({currentType})</span>
					</div>
					<div className="flex items-center gap-2">
						{availability === "available" && (
							<button
								type="button"
								onClick={handleSummarizeWithAI}
								disabled={isGenerating || !logs}
								className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								title="Resumir con IA"
							>
								{isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
								{isGenerating ? "Resumiendo..." : "Resumir"}
							</button>
						)}
						<div className="relative">
							<Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								value={filter}
								onChange={(e) => setFilter(e.target.value)}
								placeholder="Filtrar logs..."
								className="pl-7 pr-2 py-1 text-sm bg-background border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
					{summary && (
						<div className="mb-4 p-3 bg-purple-900 border border-purple-500/30 rounded-lg sticky top-0 z-10">
							<div className="flex items-center justify-between gap-2 mb-2">
								<div className="flex items-center gap-2">
									<Sparkles className="w-4 h-4 text-purple-400" />
									<span className="text-purple-300 font-semibold text-sm">Resumen con IA</span>
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => setIsAiSummaryCollapsed(!isAiSummaryCollapsed)}
										className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-800/30 rounded transition-colors"
										title={isAiSummaryCollapsed ? "Expandir" : "Colapsar"}
									>
										{isAiSummaryCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
									</button>
									<button
										type="button"
										onClick={handleCopyAiSummary}
										className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-800/30 rounded transition-colors"
										title="Copiar resumen"
									>
										{aiSummaryCopied ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
									</button>
								</div>
							</div>
							{!isAiSummaryCollapsed && (
								<>
									<p className="text-purple-100 text-xs whitespace-pre-wrap">{summary}</p>
									{aiError && (
										<p className="text-red-400 text-xs mt-2">{aiError}</p>
									)}
								</>
							)}
						</div>
					)}
					{isLoading ? (
						<div className="flex items-center justify-center gap-2 h-full text-gray-400">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Cargando logs...</span>
						</div>
					) : (
						<pre className="whitespace-pre-wrap break-words">
							{filteredLines.length > 0 
								? filteredLines.map((line, idx) => (
									<div key={idx}>{highlightLogLine(line)}</div>
								))
								: (logs || "No logs disponibles")
							}
						</pre>
					)}
				</div>
			</div>
		</div>
	);
}

