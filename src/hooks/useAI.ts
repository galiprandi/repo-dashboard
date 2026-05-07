import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

export interface AIOptions {
	type?: "key-points" | "tl;dr" | "teaser" | "headline";
	format?: "plain-text" | "markdown";
	length?: "short" | "medium" | "long";
	outputLanguage?: string;
	context?: string;
	sharedContext?: string;
	maxLines?: number;
	maxChars?: number;
}

// Función pura para generar resumen sin estado
async function generateAISummary(
	text: string,
	options: AIOptions = {}
): Promise<string> {
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
		throw new Error("Chrome AI Summarizer API no está disponible en este navegador. Requiere Chrome 113+ con la característica 'AI Summarizer' habilitada.");
	}

	// Truncar texto si es muy largo
	const truncateText = (text: string, maxLines?: number, maxChars?: number): string => {
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
	};

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
			throw new Error("La API Summarizer está disponible pero no tiene método create().");
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

	// Destruir instancia si está disponible
	if (summarizer.destroy) {
		summarizer.destroy();
	}

	return result;
}

export function useAI() {
	const [availability, setAvailability] = useState<Availability>("checking");
	const [isGenerating, setIsGenerating] = useState(false);
	const [summary, setSummary] = useState("");
	const [error, setError] = useState<string | null>(null);
	const queryClient = useQueryClient();

	useEffect(() => {
		const check = async () => {
			// Verificar si la API está disponible en window.ai.summarizer o window.Summarizer
			const hasAISummarizer = window.ai && window.ai.summarizer;
			const hasSummarizer = (window as unknown as Record<string, unknown>).Summarizer;

			if (!hasAISummarizer && !hasSummarizer) {
				console.log('[AI] Chrome AI Summarizer API not available');
				setAvailability("unavailable");
				return;
			}

			// Si está disponible en window.ai.summarizer, verificar disponibilidad
			if (hasAISummarizer && window.ai?.summarizer?.availability) {
				try {
					const status = await window.ai.summarizer.availability();
					setAvailability(status);
					if (status === "available") {
						console.log('[AI] Chrome AI Summarizer API available');
					}
				} catch {
					setAvailability("unavailable");
				}
			} else {
				setAvailability("available");
				console.log('[AI] Chrome AI Summarizer API available (via window.Summarizer)');
			}
		};
		check();
	}, []);

	const generate = useCallback(
		async (text: string, options: AIOptions = {}): Promise<string> => {
			// Verificar disponibilidad
			if (availability !== "available") {
				throw new Error("Chrome AI Summarizer API no está disponible");
			}

			setIsGenerating(true);
			setError(null);

			// Generar query key única basada en el input
			const queryKey = ['ai-summary', text, JSON.stringify(options)];

			try {
				// Verificar si ya está en caché
				const cachedData = queryClient.getQueryData<string>(queryKey);
				if (cachedData) {
					console.log('[AI] Using cached response');
					setSummary(cachedData);
					return cachedData;
				}

				// Si no está en caché, ejecutar y cachear
				const result = await queryClient.fetchQuery({
					queryKey,
					queryFn: () => generateAISummary(text, options),
					staleTime: 5 * 60 * 1000, // 5 minutos de caché
					gcTime: 10 * 60 * 1000, // 10 minutos en memoria
				});

				setSummary(result);
				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				setError(errorMessage);
				throw err;
			} finally {
				setIsGenerating(false);
			}
		},
		[availability, queryClient],
	);

	const reset = useCallback(() => {
		queryClient.removeQueries({ queryKey: ['ai-summary'] });
		setSummary("");
		setError(null);
	}, [queryClient]);

	return { 
		availability, 
		isGenerating, 
		summary, 
		error, 
		generate, 
		reset 
	};
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
