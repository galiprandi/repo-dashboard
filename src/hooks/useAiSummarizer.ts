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
	}
}

export type Availability = "available" | "unavailable" | "downloadable" | "checking";

export function useAiSummarizer() {
	const [availability, setAvailability] = useState<Availability>("checking");
	const [isGenerating, setIsGenerating] = useState(false);
	const [summary, setSummary] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const check = async () => {
			if (!window.ai?.summarizer) {
				setAvailability("unavailable");
				return;
			}
			try {
				const status = await window.ai.summarizer.availability();
				setAvailability(status);
			} catch {
				setAvailability("unavailable");
			}
		};
		check();
	}, []);

	const generate = useCallback(
		async (text: string, context?: string) => {
			if (!window.ai?.summarizer) {
				setError("Chrome AI Summarizer no está disponible");
				return;
			}
			setIsGenerating(true);
			setError(null);
			setSummary("");
			try {
				const summarizer = await window.ai.summarizer.create({
					type: "key-points",
					format: "markdown",
					length: "medium",
					outputLanguage: "es",
					sharedContext:
						"Eres un asistente técnico que resume cambios de código entre versiones de software. " +
						"Resume los cambios más importantes para que un equipo de desarrollo entienda " +
						"qué se está por desplegar a producción. Usa español.",
				});
				const result = await summarizer.summarize(text, {
					context:
						context ??
						"Resume los cambios de código pendientes de promoción a producción.",
				});
				setSummary(result);
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
		[],
	);

	const reset = useCallback(() => {
		setSummary("");
		setError(null);
		setIsGenerating(false);
	}, []);

	return { availability, isGenerating, summary, error, generate, reset };
}
