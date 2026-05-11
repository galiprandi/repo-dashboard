import { useState, useMemo } from "react";
import { GitCommit, Sparkles, Loader2, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAISummarize } from "@galiprandi/react-tools";
import { AISummaryCard } from "@/components/AISummaryCard";
import { BaseDialog } from "@/components/ui/BaseDialog";

interface CommitsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	commits: Array<{ hash: string; shortHash: string; subject: string; body: string; message: string; author: string; date: string }>;
	prodCommitHash: string;
	prodTag?: string;
}

export function CommitsModal({ open, onOpenChange, commits, prodCommitHash, prodTag }: CommitsModalProps) {
	const [filter, setFilter] = useState("");
	const [aiSummaryCopied, setAiSummaryCopied] = useState(false);
	const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
	const [isAiSummaryCollapsed, setIsAiSummaryCollapsed] = useState(false);
	const queryClient = useQueryClient();
	const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
	
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
		if (status === "initializing") return "Inicializando modelo...";
		if (status === "downloading") return "Descargando modelo...";
		if (status === "summarizing") return "Generando resumen...";
		return "Generando...";
	}, [status]);

	// Filtrar commits pendientes (después del commit de producción)
	const prodCommitIndex = commits.findIndex(c => c.hash === prodCommitHash);
	const pendingCommits = prodCommitIndex === -1 ? commits : commits.slice(0, prodCommitIndex);

	const filteredCommits = pendingCommits.filter(
		(c) => filter === "" || c.subject.toLowerCase().includes(filter.toLowerCase()) || c.body.toLowerCase().includes(filter.toLowerCase())
	);

	const handleCopyAiSummary = async () => {
		if (!summary) return;
		await navigator.clipboard.writeText(summary);
		setAiSummaryCopied(true);
		setTimeout(() => setAiSummaryCopied(false), 2000);
	};

	const toggleCommitExpansion = (commitHash: string) => {
		setExpandedCommits((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(commitHash)) {
				newSet.delete(commitHash);
			} else {
				newSet.add(commitHash);
			}
			return newSet;
		});
	};

	const handleSummarizeWithAI = async () => {
		if (pendingCommits.length === 0) return;

		// Crear texto con todos los commits, incluyendo body si está expandido
		const commitsText = pendingCommits.map(
			c => {
				const body = expandedCommits.has(c.hash) && c.body ? `\n  Body: ${c.body}` : "";
				return `- ${c.shortHash}: ${c.subject} (${c.author})${body}`;
			}
		).join('\n');

		const context = 'Genera un resumen ejecutivo para decidir si desplegar a producción. REGLAS: 1) Ignora completamente commits de "Force redeploy" o similares (no los menciones), 2) Si hay "Merge pull request", ignora los commits individuales después (solo el merge representa el cambio), 3) AGRUPA commits por ticket/jira (ej: ARARG-8013) o funcionalidad - NO listes commits individualmente, 4) Ignora cambios triviales (docs, whitespace) a menos que afecten lógica crítica. ESTRUCTURA OBLIGATORIA: 1) "Cambios principales:" - Lista agrupada por ticket/funcionalidad (ej: "ARARG-8013: Normalización de EAN NCR"), 2) "Impacto:" - Qué datos/lógica afecta y consecuencias, 3) "Riesgos:" - Qué puede romperse, datos corruptos, breaking changes, 4) "Recomendación:" - GO/NO-GO con justificación específica (por qué es seguro o riesgoso). Máximo 5-7 líneas total. Usa minúsculas en las etiquetas.';
		const textWithContext = `INSTRUCCIÓN: ${context}\n\n${commitsText}`;
		const queryKey = ['ai-summary', commitsText, context];

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
			console.error('[CommitsModal] Error generating summary:', err);
		} finally {
			setIsGeneratingLocal(false);
		}
	};

	const handleRegenerateSummary = async () => {
		queryClient.removeQueries({ queryKey: ['ai-summary'] });
		resetAI();
		await handleSummarizeWithAI();
	};

	return (
		<BaseDialog
			open={open}
			onOpenChange={onOpenChange}
			title={
				<div className="flex items-center gap-2">
					<GitCommit className="w-5 h-5 text-primary" />
					<span>Cambios desde {prodTag || "último deploy"}</span>
					<span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
						{pendingCommits.length} commits
					</span>
				</div>
			}
			description="Lista de commits pendientes de desplegar"
			maxWidth="max-w-5xl"
		>
			<div className="flex flex-col h-full gap-4 min-h-0">
				{/* Top Actions */}
				<div className="flex items-center justify-end gap-3 flex-shrink-0">
					<button
						type="button"
						onClick={handleSummarizeWithAI}
						disabled={isGenerating || availability !== "available" || pendingCommits.length === 0}
						className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
						aria-label="Resumir cambios con IA"
					>
						{isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
						{isGenerating ? getStatusMessage : "Resumir con IA"}
					</button>
					<div className="relative group">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
						<input
							type="text"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder="Filtrar commits..."
							className="pl-9 pr-3 py-1.5 text-sm bg-background border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
							aria-label="Filtrar lista de commits"
						/>
					</div>
				</div>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
					<AISummaryCard
						summary={summary}
						isGenerating={isGenerating}
						error={aiError?.message || null}
						onRegenerate={handleRegenerateSummary}
						onCopy={handleCopyAiSummary}
						isCollapsed={isAiSummaryCollapsed}
						onToggleCollapse={() => setIsAiSummaryCollapsed(!isAiSummaryCollapsed)}
						isCopied={aiSummaryCopied}
					/>

					{pendingCommits.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
							<GitCommit className="w-12 h-12 opacity-20 mb-4" />
							<p className="text-lg font-medium">No hay commits pendientes</p>
							<p className="text-sm">El ambiente está actualizado con producción.</p>
						</div>
					) : filteredCommits.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
							<Search className="w-12 h-12 opacity-20 mb-4" />
							<p className="text-lg font-medium">Sin resultados</p>
							<p className="text-sm">No se encontraron commits que coincidan con "{filter}"</p>
						</div>
					) : (
						<div className="space-y-2">
							{filteredCommits.map((commit) => (
								<div
									key={commit.hash}
									className="p-3 bg-card rounded-xl border border-border/50 hover:bg-accent hover:border-primary/30 transition-all duration-200 focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 group outline-none"
									onClick={() => toggleCommitExpansion(commit.hash)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											toggleCommitExpansion(commit.hash);
										}
									}}
									role="button"
									aria-expanded={expandedCommits.has(commit.hash)}
									tabIndex={0}
								>
									<div className="flex items-start gap-4">
										<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
											<GitCommit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-4">
												<p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
													{commit.subject}
												</p>
												{commit.body && (
													<div className="flex-shrink-0">
														{expandedCommits.has(commit.hash) ? (
															<ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
														) : (
															<ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
														)}
													</div>
												)}
											</div>
											<div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
												<span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
													{commit.shortHash}
												</span>
												<span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
												<span className="font-medium">{commit.author}</span>
												<span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
												<span>{commit.date}</span>
											</div>
											{expandedCommits.has(commit.hash) && commit.body && (
												<div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200 border border-border/50">
													{commit.body}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</BaseDialog>
	);
}
