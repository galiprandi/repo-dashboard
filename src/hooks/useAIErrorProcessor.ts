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
		// Extract error message once
		const errorMessage = error instanceof Error ? error.message : error
		
		// Early return if AI not available
		if (!enabled || availability !== "available") {
			return errorMessage
		}

		setIsProcessing(true)
		setProcessedError(null)

		try {
			const result = await generate(errorMessage, {
				type: "teaser",
				format: "plain-text",
				length: "short",
				outputLanguage: "es",
				context: "Explicá este error técnico de forma simple y breve para un usuario no técnico. Máximo 2 oraciones. Sin detalles técnicos innecesarios. Directo al punto."
			})

			const finalResult = result || errorMessage
			setProcessedError(finalResult)
			return finalResult
		} catch {
			// Fallback to original error message
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
