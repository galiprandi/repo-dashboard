import { useState, useCallback, useEffect } from "react";

interface Summarizer {
	summarize(text: string, options?: { context?: string }): Promise<string>;
	summarizeStreaming(
		text: string,
		options?: { context?: string },
	): AsyncIterable<string>;
	destroy?(): void;
}

interface SummarizerCreateOptions {
	type?: "key-points" | "tl;dr" | "teaser" | "headline";
	format?: "plain-text" | "markdown";
	length?: "short" | "medium" | "long";
	sharedContext?: string;
	outputLanguage?: string;
}

interface AI {
	summarizer: {
		create(options?: SummarizerCreateOptions): Promise<Summarizer>;
		availability(): Promise<"available" | "unavailable" | "downloadable">;
	};
}

declare global {
	interface Window {
		ai?: AI;
		Summarizer?: {
			create(options?: SummarizerCreateOptions): Promise<Summarizer>;
		};
	}
}

export type Availability = "available" | "unavailable" | "downloadable" | "checking";

export interface SummarizerOptions {
	type?: "key-points" | "tl;dr" | "teaser" | "headline";
	format?: "plain-text" | "markdown";
	length?: "short" | "medium" | "long";
	outputLanguage?: string;
	context?: string;
	sharedContext?: string;
	maxLines?: number;
	maxChars?: number;
}

export function useAISummarizer() {
	const [availability, setAvailability] = useState<Availability>("checking");
	const [isGenerating, setIsGenerating] = useState(false);
	const [summary, setSummary] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const check = async () => {
			// Verificar si la API está disponible en window.ai.summarizer o window.Summarizer
			const hasAISummarizer = window.ai && window.ai.summarizer;
			const hasSummarizer = (window as unknown as Record<string, unknown>).Summarizer;

			if (!hasAISummarizer && !hasSummarizer) {
				setAvailability("unavailable");
				return;
			}

			// Si está disponible en window.ai.summarizer, verificar disponibilidad
			if (hasAISummarizer && window.ai?.summarizer?.availability) {
				try {
					const status = await window.ai.summarizer.availability();
					setAvailability(status);
				} catch {
					setAvailability("unavailable");
				}
			} else {
				setAvailability("available");
			}
		};
		check();
	}, []);

	const truncateText = useCallback((text: string, maxLines?: number, maxChars?: number): string => {
		let truncated = text;

		if (maxLines) {
			const lines = truncated.split('\n');
			if (lines.length > maxLines) {
				truncated = lines.slice(-maxLines).join('\n');
			}
		}

		if (maxChars && truncated.length > maxChars) {
			truncated = truncated.slice(-maxChars);
		}

		return truncated;
	}, []);

	const generate = useCallback(
		async (text: string, options: SummarizerOptions = {}) => {
			const {
				type = "key-points",
				format = "plain-text",
				length = "medium",
				outputLanguage = "es",
				context,
				sharedContext,
				maxLines = 200,
				maxChars = 10000,
			} = options;

			// Verificar disponibilidad
			const hasAISummarizer = window.ai && window.ai.summarizer;
			const hasSummarizer = (window as unknown as Record<string, unknown>).Summarizer;

			if (!hasAISummarizer && !hasSummarizer) {
				setError("Chrome AI Summarizer API no está disponible en este navegador. Requiere Chrome 113+ con la característica 'AI Summarizer' habilitada.");
				return;
			}

			setIsGenerating(true);
			setError(null);
			setSummary("");

			try {
				// Truncar texto si es muy largo
				const truncatedText = truncateText(text, maxLines, maxChars);

				// Agregar contexto si se proporciona
				const textWithContext = context 
					? `INSTRUCCIÓN: ${context}\n\n${truncatedText}`
					: truncatedText;

				let summarizer: Summarizer;

				if (hasAISummarizer) {
					// Usar window.ai.summarizer.create()
					summarizer = await window.ai!.summarizer.create({
						type,
						format,
						length,
						outputLanguage,
						sharedContext,
					});
				} else {
					// Usar window.Summarizer
					const SummarizerClass = (window as unknown as Record<string, unknown>).Summarizer as {
						create(options?: SummarizerCreateOptions): Promise<Summarizer>;
					};
					if (typeof SummarizerClass.create !== 'function') {
						setError("La API Summarizer está disponible pero no tiene método create().");
						return;
					}
					summarizer = await SummarizerClass.create({
						type,
						format,
						length,
						outputLanguage,
						sharedContext,
					});
				}

				const result = await summarizer.summarize(textWithContext);
				setSummary(result);

				// Destruir instancia si está disponible
				if (summarizer.destroy) {
					summarizer.destroy();
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Error al generar el resumen",
				);
			} finally {
				setIsGenerating(false);
			}
		},
		[truncateText],
	);

	const reset = useCallback(() => {
		setSummary("");
		setError(null);
		setIsGenerating(false);
	}, []);

	return { availability, isGenerating, summary, error, generate, reset };
}

// Helper para verificar si la API está disponible sin usar el hook
export async function checkAIAvailability(): Promise<boolean> {
	const hasAISummarizer = window.ai && window.ai.summarizer;
	const hasSummarizer = (window as unknown as Record<string, unknown>).Summarizer;

	if (!hasAISummarizer && !hasSummarizer) {
		return false;
	}

	if (hasAISummarizer && window.ai?.summarizer?.availability) {
		try {
			const status = await window.ai.summarizer.availability();
			return status === "available";
		} catch {
			return false;
		}
	}

	return true;
}
