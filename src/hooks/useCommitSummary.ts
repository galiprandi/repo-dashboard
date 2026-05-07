import { useState } from "react"
import { useAI } from "./useAI"

interface Commit {
	hash: string
	shortHash: string
	subject: string
	body: string
	message: string
	author: string
	date: string
}

interface UseCommitSummaryOptions {
	enabled?: boolean
}

export function useCommitSummary(options: UseCommitSummaryOptions = {}) {
	const { enabled = true } = options
	const { availability, isGenerating, summary, error: aiError, generate, reset } = useAI()
	const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

	const generateCommitSummary = async (commits: Commit[]): Promise<string> => {
		if (!enabled || availability !== "available" || commits.length === 0) {
			return ""
		}

		setIsGeneratingSummary(true)

		try {
			// Crear texto con todos los commits
			const commitsText = commits.map(
				c => `- ${c.shortHash}: ${c.subject} (${c.author})${c.body ? `\n  Body: ${c.body}` : ""}`
			).join('\n')

			if (commits.length === 0) {
				return ""
			}

			// Generar resumen con prompt simple
			const result = await generate(commitsText, {
				type: 'key-points',
				outputLanguage: 'en',
				context: 'Generate release notes in English. Use category headers with emojis: 🐛 FIXES, ✨ FEATURES, 🎨 CHORES, ♻️ REFACTOR, 📝 DOCS. Format each bullet as: * short-hash: description. CRITICAL: Do NOT duplicate commits - each commit should appear once. Only use information from commit subjects. Do NOT add details not present in commits.',
				maxLines: 200,
				maxChars: 10000,
			})

			return result || ""
		} catch (err) {
			console.error('[useCommitSummary] Error generating summary:', err)
			return ""
		} finally {
			setIsGeneratingSummary(false)
		}
	}

	return {
		generateCommitSummary,
		isGenerating: isGenerating || isGeneratingSummary,
		summary,
		error: aiError,
		reset,
		isAvailable: availability === "available" && enabled
	}
}
