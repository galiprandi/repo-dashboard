import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Loader2, Search, RefreshCw, X, ClipboardCopy, Check, Activity, Clock, RotateCcw, CheckCircle2, Sparkles } from "lucide-react";
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
	const [aiSummary, setAiSummary] = useState<string | null>(null);
	const [isSummarizing, setIsSummarizing] = useState(false);
	const [isAIAvailable, setIsAIAvailable] = useState(false);
	const [aiSummaryCopied, setAiSummaryCopied] = useState(false);

	// Verificar disponibilidad de API de Chrome AI Summarizer al cargar
	useEffect(() => {
		const checkAIAvailability = async () => {
			const hasAISummarizer = window.ai && window.ai.summarizer;
			const hasSummarizer = (window as unknown as Record<string, unknown>).Summarizer;
			setIsAIAvailable(!!hasAISummarizer || !!hasSummarizer);
		};
		checkAIAvailability();
	}, []);

	const filteredLines = logs
		? logs.split("\n").filter((line) => filter === "" || line.toLowerCase().includes(filter.toLowerCase()))
		: [];

	const handleCopy = async () => {
		if (!logs) return;
		await navigator.clipboard.writeText(logs);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleCopyAiSummary = async () => {
		if (!aiSummary) return;
		await navigator.clipboard.writeText(aiSummary);
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
		
		setIsSummarizing(true);
		try {
			// Verificar si la API de Chrome AI está disponible
			// Puede estar bajo window.ai.summarizer o directamente como window.Summarizer
			const hasAISummarizer = window.ai && window.ai.summarizer;
			const hasSummarizer = (window as unknown as Record<string, unknown>).Summarizer;

			if (!hasAISummarizer && !hasSummarizer) {
				setAiSummary("Chrome AI Summarizer API no está disponible en este navegador. Requiere Chrome 113+ con la característica 'AI Summarizer' habilitada.");
				return;
			}

			// Usar logs filtrados si hay filtro activo, si no usar todos los logs
			const logsToSummarize = filter.length > 0 ? filteredLines.join('\n') : logs;

			// Truncar logs a las últimas 200 líneas para evitar error de input demasiado grande
			const logLines = logsToSummarize.split('\n');
			let truncatedLogs = logLines.length > 200 
				? logLines.slice(-200).join('\n') 
				: logsToSummarize;
			
			// Si aún es muy largo, truncar por caracteres (máximo 10000 caracteres)
			if (truncatedLogs.length > 10000) {
				truncatedLogs = truncatedLogs.slice(-10000);
			}

			// Agregar instrucción de contexto al inicio de los logs para enfocar en anomalías
			const logsWithContext = `INSTRUCCIÓN: Enfócate en identificar anomalías, errores, advertencias y problemas en los logs. Resalta cualquier comportamiento inusual o que requiera atención.\n\n${truncatedLogs}`;

			// Detectar idioma del navegador (ej: 'es-ES', 'en-US')
			const browserLanguage = navigator.language || 'en';
			// Extraer el código de idioma (ej: 'es' de 'es-ES')
			let languageCode = browserLanguage.split('-')[0];
			
			// Si el idioma no es español, usar español por defecto (el usuario habla español)
			if (languageCode !== 'es') {
				languageCode = 'es';
			}

			let summarizerInstance: {
				summarize: (text: string) => Promise<string>;
			};
			
			if (hasAISummarizer) {
				// Usar window.ai.summarizer.create() con idioma español
				summarizerInstance = await window.ai!.summarizer.create({ 
					outputLanguage: languageCode,
					type: 'key-points',
				});
			} else {
				// Intentar usar el método create si está disponible en window.Summarizer
				const SummarizerClass = (window as unknown as Record<string, unknown>).Summarizer as {
					create: (options?: { outputLanguage?: string; type?: string }) => Promise<{
						summarize: (text: string) => Promise<string>;
					}>;
				};
				if (typeof SummarizerClass.create === 'function') {
					summarizerInstance = await SummarizerClass.create({ 
						outputLanguage: languageCode,
						type: 'key-points',
					});
				} else {
					setAiSummary("La API Summarizer está disponible pero no tiene método create(). Verifica la documentación de tu navegador.");
					return;
				}
			}
			
			// Generar resumen con logs con contexto
			const summary = await summarizerInstance.summarize(logsWithContext);
			
			// Agregar nota si se truncó
			const summaryWithNote = logLines.length > 200 || logs.length > 10000
				? `${summary}\n\n*Nota: Resumen generado con las últimas 200 líneas o 10000 caracteres (lo que sea menor) de ${logLines.length} líneas totales.*`
				: summary;
			
			setAiSummary(summaryWithNote);
		} catch (error) {
			setAiSummary(`Error al generar resumen: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setIsSummarizing(false);
		}
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
						{isAIAvailable && (
							<button
								type="button"
								onClick={handleSummarizeWithAI}
								disabled={isSummarizing || !logs}
								className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								title="Resumir con IA"
							>
								{isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
								{isSummarizing ? "Resumiendo..." : "Resumir"}
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
					{aiSummary && (
						<div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
							<div className="flex items-center justify-between gap-2 mb-2">
								<div className="flex items-center gap-2">
									<Sparkles className="w-4 h-4 text-purple-400" />
									<span className="text-purple-300 font-semibold text-sm">Resumen con IA</span>
								</div>
								<button
									type="button"
									onClick={handleCopyAiSummary}
									className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-800/30 rounded transition-colors"
									title="Copiar resumen"
								>
									{aiSummaryCopied ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
								</button>
							</div>
							<p className="text-purple-100 text-xs whitespace-pre-wrap">{aiSummary}</p>
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

