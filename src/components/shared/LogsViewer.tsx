import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, RefreshCw, X, ClipboardCopy, Check, Clock, Sparkles, AlertCircle, Blocks } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useAISummarize } from "@galiprandi/react-tools";
import { useAIErrorProcessor } from "@/hooks/useAIErrorProcessor";
import { AISummaryCard } from "@/components/AISummaryCard";
import { highlightLogLine, groupLogs, logLevelPattern } from "./logUtils";

export interface LogsViewerProps {
	resourceName: string;
	resourceType: string;
	fetchLogs: (tail: number) => Promise<string>;
	queryKey: readonly unknown[];
	onClose: () => void;
	initialTailSize?: number;
	asModal?: boolean;
	containers?: { id: string; name: string }[];
	onContainerChange?: (containerId: string) => void;
}

export function LogsViewer({
	resourceName,
	resourceType,
	fetchLogs,
	queryKey,
	onClose,
	initialTailSize = 100,
	asModal = true,
	containers,
	onContainerChange,
}: LogsViewerProps) {
	const [logTailSize, setLogTailSize] = useState<number>(initialTailSize);
	const [autoFetch, setAutoFetch] = useState(true);
	const queryClient = useQueryClient();

	const { data: logs, isLoading, refetch, error: logsError } = useQuery({
		queryKey,
		queryFn: async () => {
			const result = await fetchLogs(logTailSize);
			return result;
		},
		refetchInterval: autoFetch ? 10000 : false,
	});

	const [filter, setFilter] = useState("");
	const [logLevelFilter, setLogLevelFilter] = useState<"all" | "ERROR" | "WARN" | "INFO" | "DEBUG">("all");
	const [copied, setCopied] = useState(false);
	const [aiSummaryCopied, setAiSummaryCopied] = useState(false);
	const [isAiSummaryCollapsed, setIsAiSummaryCollapsed] = useState(false);
	const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

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

	// Estado para errores procesados por AI
	const [processedError, setProcessedError] = useState<string | null>(null);

	// Manejar errores de queries con AI
	useEffect(() => {
		const handleQueryError = async (err: unknown) => {
			if (!err) return;
			const errorObj = err instanceof Error ? err : new Error(String(err));
			const friendlyError = await processError(errorObj);
			setProcessedError(friendlyError);
		};

		if (logsError) handleQueryError(logsError);
	}, [logsError, processError]);

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

	const handleSummarizeWithAI = async () => {
		if (!logs) return;

		const logsToSummarize = filteredLines.join('\n');
		const context = 'Analiza los logs SOLO para identificar problemas. Si los logs están en formato JSON, extrae el mensaje de error y el nivel (level). REGLAS ESTRICTAS: 1) NO repitas los logs completos o en JSON, 2) NO menciones configuración, rutas, startup, Swagger, mapeo de controladores, debug info, 3) Solo reporta ERRORES, WARNINGS, EXCEPCIONES, TIMEOUTS, FALLOS DE CONEXIÓN en lenguaje natural, 4) Compliance: secretos expuestos, credenciales en texto plano. ESTRUCTURA EXACTA (máximo 4 líneas, texto plano): * Errores críticos: [descripción en lenguaje natural o "ninguno"] * Warnings: [descripción en lenguaje natural o "ninguno"] * Compliance: [problemas o "ninguno"] * Estado general: HEALTHY/DEGRADED/CRITICAL. NO agregues secciones adicionales. Usa minúsculas en las etiquetas.';
		const textWithContext = `INSTRUCCIÓN: ${context}\n\n${logsToSummarize}`;
		const aiSummaryQueryKey = ['ai-summary', logsToSummarize, context];

		setIsGeneratingLocal(true);

		try {
			const cachedData = queryClient.getQueryData<string>(aiSummaryQueryKey);
			if (cachedData) return;

			await queryClient.fetchQuery({
				queryKey: aiSummaryQueryKey,
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
			console.error('[LogsViewer] Error generating summary:', err);
		} finally {
			setIsGeneratingLocal(false);
		}
		setProcessedError(null);
	};

	const handleRegenerateSummary = async () => {
		queryClient.removeQueries({ queryKey: ['ai-summary'] });
		resetAI();
		await handleSummarizeWithAI();
	};

	const content = (
		<>
			<Tooltip.Provider>
				<div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						{asModal && containers && containers.length > 0 ? (
							<div className="flex items-center gap-2">
								<Blocks className="w-4 h-4 text-muted-foreground" />
								<select
									value={resourceName}
									onChange={(e) => onContainerChange?.(e.target.value)}
									className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{containers.map((container) => (
										<option key={container.id} value={container.name}>
											{container.name}
										</option>
									))}
								</select>
							</div>
						) : (
							<h3 className="font-semibold">Logs: {resourceName} ({resourceType})</h3>
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
									value={logTailSize}
									onChange={(e) => setLogTailSize(Number(e.target.value))}
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
						{asModal && (
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
						)}
					</div>
				</div>
			</Tooltip.Provider>
			<div className="flex-1 min-h-0 overflow-auto bg-black text-green-400 p-4 font-mono text-xs">
				{processedError && (
					<div className="mb-4 p-3 bg-red-900 border border-red-500/30 rounded-lg sticky top-0 z-10">
						<div className="flex items-center justify-between gap-2 mb-2">
							<div className="flex items-center gap-2">
								<AlertCircle className="w-4 h-4 text-red-400" />
								<span className="text-red-300 font-semibold text-sm">Error</span>
							</div>
							<button
								onClick={() => setProcessedError(null)}
								className="text-xs text-red-300 hover:text-red-200 hover:bg-red-800/30 rounded px-2 py-1 transition-colors"
							>
								<X className="w-3 h-3" />
							</button>
						</div>
						<p className="text-red-100 text-xs whitespace-pre-wrap">{processedError}</p>
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
					<pre className="whitespace-pre-wrap break-words">
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
		</>
	);

	if (asModal) {
		return (
			<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
				<div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '90vw', height: '90vh', maxWidth: '1800px', display: 'flex', flexDirection: 'column' }}>
					{content}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background rounded-lg shadow-lg w-full h-full max-h-[80vh] flex flex-col overflow-hidden">
			{content}
		</div>
	);
}
