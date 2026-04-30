import { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Streamdown } from "streamdown";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useGitDiff } from "@/hooks/useGitDiff";
import { useAiSummarizer } from "@/hooks/useAiSummarizer";

interface DiffSummaryButtonProps {
	repo: string;
	tagName?: string;
	branch?: string;
}

export function DiffSummaryButton({
	repo,
	tagName,
	branch = "main",
}: DiffSummaryButtonProps) {
	const [open, setOpen] = useState(false);
	const { data: diffText, isLoading: isDiffLoading, error: diffError } =
		useGitDiff({
			repo,
			base: tagName ?? "",
			head: branch,
			enabled: open && !!tagName,
		});

	const {
		availability,
		isGenerating,
		summary,
		error: aiError,
		generate,
		reset,
	} = useAiSummarizer();

	useEffect(() => {
		if (
			diffText &&
			(availability === "available" || availability === "downloadable") &&
			!isGenerating &&
			!summary &&
			!aiError
		) {
			generate(diffText, `Resumen de cambios entre ${tagName} y ${branch} en ${repo}.`);
		}
	}, [diffText, availability, isGenerating, summary, aiError, generate, tagName, branch, repo]);

	const handleOpen = () => {
		reset();
		setOpen(true);
	};

	const handleClose = (value: boolean) => {
		if (!value) {
			setOpen(false);
		}
	};

	// Solo mostrar el botón si hay tag y la API está disponible o descargable
	if (!tagName || (availability !== "available" && availability !== "downloadable")) {
		return null;
	}

	return (
		<>
			<button
				type="button"
				onClick={handleOpen}
				className="inline-flex items-center justify-center p-0.5 rounded hover:bg-orange-100 text-orange-500 transition-colors"
				title="Resumir cambios pendientes con IA"
			>
				<Sparkles className="w-3 h-3" />
			</button>

			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-orange-500" />
							Resumen de cambios pendientes
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div className="text-sm text-muted-foreground">
							{repo} · <span className="font-mono text-xs">{tagName}...{branch}</span>
						</div>

						{isDiffLoading && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
								<Loader2 className="w-4 h-4 animate-spin" />
								Obteniendo diff desde GitHub...
							</div>
						)}

						{diffError && (
							<div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
								<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
								<div>
									<p className="font-medium">Error al obtener el diff</p>
									<p className="text-xs">{diffError.message}</p>
								</div>
							</div>
						)}

						{!isDiffLoading && !diffError && availability === "downloadable" && isGenerating && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
								<Loader2 className="w-4 h-4 animate-spin" />
								Descargando modelo de IA... Esto puede tomar unos minutos.
							</div>
						)}

						{!isDiffLoading && !diffError && availability === "available" && isGenerating && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
								<Loader2 className="w-4 h-4 animate-spin" />
								Generando resumen con IA...
							</div>
						)}

						{aiError && (
							<div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
								<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
								<div>
									<p className="font-medium">Error al generar el resumen</p>
									<p className="text-xs">{aiError}</p>
								</div>
							</div>
						)}

						{summary && (
							<div className="border rounded-lg p-4 bg-muted/30">
								<div className="prose prose-sm max-w-none dark:prose-invert">
									<Streamdown>{summary}</Streamdown>
								</div>
							</div>
						)}

						{(aiError || (diffError && !isDiffLoading)) && (
							<div className="flex justify-end">
								<button
									type="button"
									onClick={() => {
										reset();
										if (diffText) {
											generate(diffText, `Resumen de cambios entre ${tagName} y ${branch} en ${repo}.`);
										}
									}}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
								>
									<RefreshCw className="w-3.5 h-3.5" />
									Reintentar
								</button>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
