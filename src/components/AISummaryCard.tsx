import { Sparkles, Loader2, ClipboardCopy, Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface AISummaryCardProps {
	summary: string | null;
	isGenerating: boolean;
	error: string | null;
	onRegenerate: () => void;
	onCopy: () => void;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	isCopied: boolean;
	variant?: "default" | "compact";
}

export function AISummaryCard({
	summary,
	isGenerating,
	error,
	onRegenerate,
	onCopy,
	isCollapsed,
	onToggleCollapse,
	isCopied,
	variant = "default",
}: AISummaryCardProps) {
	if (!summary) return null;

	const isCompact = variant === "compact";

	return (
		<div className={`mb-4 ${isCompact ? 'p-3 bg-purple-900 border-purple-500/30' : 'p-4 bg-purple-950 border-purple-500/50'} border rounded-lg sticky top-0 z-10`}>
			<div className="flex items-center justify-between gap-2 mb-2">
				<div className="flex items-center gap-2">
					<Sparkles className="w-4 h-4 text-white" />
					<span className={`${isCompact ? 'text-white' : 'text-white'} font-semibold ${isCompact ? 'text-xs' : 'text-sm'}`}>Resumen con IA</span>
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={onToggleCollapse}
						className={`inline-flex items-center gap-1 px-2 py-1 ${isCompact ? 'text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-800/30' : 'text-xs text-purple-200 hover:text-purple-100 hover:bg-purple-800/50'} rounded transition-colors`}
						title={isCollapsed ? "Expandir" : "Colapsar"}
					>
						{isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
					</button>
					<button
						type="button"
						onClick={onRegenerate}
						disabled={isGenerating}
						className={`inline-flex items-center gap-1 px-2 py-1 ${isCompact ? 'text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-800/30' : 'text-xs text-purple-200 hover:text-purple-100 hover:bg-purple-800/50'} rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
						title="Regenerar resumen"
					>
						{isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
					</button>
					<button
						type="button"
						onClick={onCopy}
						className={`inline-flex items-center gap-1 px-2 py-1 ${isCompact ? 'text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-800/30' : 'text-xs text-purple-200 hover:text-purple-100 hover:bg-purple-800/50'} rounded transition-colors`}
						title="Copiar resumen"
					>
						{isCopied ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
					</button>
				</div>
			</div>
			{!isCollapsed && (
				<>
					<p className={`${isCompact ? 'text-purple-100 text-xs' : 'text-purple-50 text-sm leading-relaxed'} whitespace-pre-wrap`}>{summary}</p>
					{error && (
						<p className="text-red-400 text-sm mt-2">{error}</p>
					)}
				</>
			)}
		</div>
	);
}
