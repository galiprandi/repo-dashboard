import { useState } from "react";
import { X, Sparkles, Loader2, ClipboardCopy, Check, GitCommit, ChevronDown, ChevronUp } from "lucide-react";
import { useAISummarizer } from "@/hooks/useAiSummarizer";

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

	// Usar hook de AI Summarizer
	const { availability, isGenerating, summary, error: aiError, generate: generateAISummary } = useAISummarizer();

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

	if (!isOpen) return null;

	return (
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
					{summary && (
						<div className="mb-4 p-4 bg-purple-950 border border-purple-500/50 rounded-lg sticky top-0 z-10">
							<div className="flex items-center justify-between gap-2 mb-2">
								<div className="flex items-center gap-2">
									<Sparkles className="w-4 h-4 text-purple-400" />
									<span className="text-purple-100 font-semibold text-sm">Resumen con IA</span>
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => setIsAiSummaryCollapsed(!isAiSummaryCollapsed)}
										className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-200 hover:text-purple-100 hover:bg-purple-800/50 rounded transition-colors"
										title={isAiSummaryCollapsed ? "Expandir" : "Colapsar"}
									>
										{isAiSummaryCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
									</button>
									<button
										type="button"
										onClick={handleCopyAiSummary}
										className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-200 hover:text-purple-100 hover:bg-purple-800/50 rounded transition-colors"
										title="Copiar resumen"
									>
										{aiSummaryCopied ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
									</button>
								</div>
							</div>
							{!isAiSummaryCollapsed && (
								<>
									<p className="text-purple-50 text-sm whitespace-pre-wrap leading-relaxed">{summary}</p>
									{aiError && (
										<p className="text-red-400 text-sm mt-2">{aiError}</p>
									)}
								</>
							)}
						</div>
					)}
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
								<div key={commit.hash} className="p-3 bg-muted/30 rounded border cursor-pointer" onClick={() => toggleCommitExpansion(commit.hash)}>
									<div className="flex items-start gap-3">
										<GitCommit className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p className="text-sm font-medium truncate">{commit.subject}</p>
											</div>
											<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
												<span className="font-mono">{commit.shortHash}</span>
												<span>•</span>
												<span>{commit.author}</span>
												<span>•</span>
												<span>{commit.date}</span>
											</div>
											{expandedCommits.has(commit.hash) && commit.body && (
												<div className="mt-2 p-2 rounded text-xs text-muted-foreground whitespace-pre-wrap">
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
		</div>
	);
}
