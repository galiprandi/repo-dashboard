import { useState } from "react";
import { createPortal } from "react-dom";
import { X, GitCommit, Sparkles, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { AISummaryCard } from "@/components/AISummaryCard";

interface CommitsModalProps {
	isOpen: boolean;
	onClose: () => void;
	commits: Array<{ hash: string; shortHash: string; subject: string; body: string; message: string; author: string; date: string }>;
	prodCommitHash: string;
	prodTag?: string;
}

export function CommitsModal({ isOpen, onClose, commits, prodCommitHash, prodTag }: CommitsModalProps) {
	const [filter, setFilter] = useState("");
	const [aiSummaryCopied, setAiSummaryCopied] = useState(false);
	const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
	const [isAiSummaryCollapsed, setIsAiSummaryCollapsed] = useState(false);

	// Usar hook de AI
	const { availability, isGenerating, summary, error: aiError, generate: generateAISummary, reset: resetAI } = useAI();

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

		// Generar resumen con el hook
		await generateAISummary(commitsText, {
			type: 'key-points',
			context: 'Genera un resumen ejecutivo para decidir si desplegar a producción. REGLAS: 1) Ignora completamente commits de "Force redeploy" o similares (no los menciones), 2) Si hay "Merge pull request", ignora los commits individuales después (solo el merge representa el cambio), 3) AGRUPA commits por ticket/jira (ej: ARARG-8013) o funcionalidad - NO listes commits individualmente, 4) Ignora cambios triviales (docs, whitespace) a menos que afecten lógica crítica. ESTRUCTURA OBLIGATORIA: 1) "Cambios principales:" - Lista agrupada por ticket/funcionalidad (ej: "ARARG-8013: Normalización de EAN NCR"), 2) "Impacto:" - Qué datos/lógica afecta y consecuencias, 3) "Riesgos:" - Qué puede romperse, datos corruptos, breaking changes, 4) "Recomendación:" - GO/NO-GO con justificación específica (por qué es seguro o riesgoso). Máximo 5-7 líneas total. Usa minúsculas en las etiquetas.',
			maxLines: 200,
			maxChars: 10000,
		});
	};

	const handleRegenerateSummary = async () => {
		resetAI();
		await handleSummarizeWithAI();
	};

	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-background rounded-lg shadow-lg w-[50vw] h-[70vh] max-w-[900px] flex flex-col overflow-hidden">
				<div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold">Cambios desde el tag {prodTag || "último deploy"}</h3>
						<span className="text-xs text-muted-foreground">({pendingCommits.length} commits)</span>
					</div>
					<div className="flex items-center gap-2">
						{availability === "available" && pendingCommits.length > 0 && (
							<button
								type="button"
								onClick={handleSummarizeWithAI}
								disabled={isGenerating}
								className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								title="Resumir con IA"
							>
								{isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
								{isGenerating ? "Resumiendo..." : "Resumir"}
							</button>
						)}
						<div className="relative">
							<input
								type="text"
								value={filter}
								onChange={(e) => setFilter(e.target.value)}
								placeholder="Filtrar commits..."
								className="pl-7 pr-2 py-1 text-sm bg-background border rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
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
				<div className="flex-1 overflow-auto p-4">
					<AISummaryCard
						summary={summary}
						isGenerating={isGenerating}
						error={aiError}
						onRegenerate={handleRegenerateSummary}
						onCopy={handleCopyAiSummary}
						isCollapsed={isAiSummaryCollapsed}
						onToggleCollapse={() => setIsAiSummaryCollapsed(!isAiSummaryCollapsed)}
						isCopied={aiSummaryCopied}
					/>
					{pendingCommits.length === 0 ? (
						<div className="flex items-center justify-center h-full text-muted-foreground">
							<p>No hay commits pendientes</p>
						</div>
					) : filteredCommits.length === 0 ? (
						<div className="flex items-center justify-center h-full text-muted-foreground">
							<p>No se encontraron commits que coincidan con el filtro</p>
						</div>
					) : (
						<div className="space-y-2">
							{filteredCommits.map((commit) => (
								<div
									key={commit.hash}
									className="p-3 bg-muted/30 rounded border cursor-pointer hover:bg-accent hover:border-primary/30 transition-all duration-200 focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
									onClick={() => toggleCommitExpansion(commit.hash)}
									role="button"
									aria-expanded={expandedCommits.has(commit.hash)}
									tabIndex={0}
								>
									<div className="flex items-start gap-3">
										<GitCommit className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p className="text-sm font-medium truncate">{commit.subject}</p>
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
											<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
												<span className="font-mono">{commit.shortHash}</span>
												<span>•</span>
												<span>{commit.author}</span>
												<span>•</span>
												<span>{commit.date}</span>
											</div>
											{expandedCommits.has(commit.hash) && commit.body && (
												<div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200">
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
		</div>,
		document.body
	);
}
