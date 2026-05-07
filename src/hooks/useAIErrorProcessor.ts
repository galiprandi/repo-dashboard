import { useState } from "react"
import { useAISummarizer } from "./useAiSummarizer"

interface UseAIErrorProcessorOptions {
	enabled?: boolean
}

export function useAIErrorProcessor(options: UseAIErrorProcessorOptions = {}) {
	const { enabled = true } = options
	const { availability, generate } = useAISummarizer()
	const [isProcessing, setIsProcessing] = useState(false)
	const [processedError, setProcessedError] = useState<string | null>(null)

	const processError = async (error: Error | string): Promise<string> => {
		if (!enabled || availability !== "available") {
			return error instanceof Error ? error.message : error
		}

		setIsProcessing(true)
		setProcessedError(null)

		try {
			const errorMessage = error instanceof Error ? error.message : error
			
			const result = await generate(errorMessage, {
				type: "teaser",
				format: "plain-text",
				length: "short",
				outputLanguage: "es",
				context: "Explicá este error técnico de forma simple y breve para un usuario no técnico. Máximo 2 oraciones. Sin detalles técnicos innecesarios. Directo al punto."
			})

			setProcessedError(result || errorMessage)
			return result || errorMessage
		} catch {
			// Si falla el procesamiento con AI, devolver el error original
			const errorMessage = error instanceof Error ? error.message : error
			return errorMessage
		} finally {
			setIsProcessing(false)
		}
	}

	return {
		processError,
		isProcessing,
		processedError,
		isAvailable: availability === "available" && enabled
	}
}
