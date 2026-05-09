import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Newspaper } from "lucide-react"
import { Streamdown } from "streamdown"
import { BaseDialog } from "@/components/ui/BaseDialog"
import novedadesContent from "../../NOVEDADES.md?raw"

export function NovedadesDialog() {
	const [open, setOpen] = useState(false)

	useEffect(() => {
		// Add custom scrollbar styles
		const style = document.createElement('style')
		style.textContent = `
			.custom-scrollbar::-webkit-scrollbar {
				width: 8px;
			}
			.custom-scrollbar::-webkit-scrollbar-track {
				background: #f1f1f1;
				border-radius: 4px;
			}
			.custom-scrollbar::-webkit-scrollbar-thumb {
				background: #888;
				border-radius: 4px;
			}
			.custom-scrollbar::-webkit-scrollbar-thumb:hover {
				background: #555;
			}
			@media (prefers-color-scheme: dark) {
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #1f2937;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #4b5563;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #6b7280;
				}
			}
		`
		document.head.appendChild(style)
		return () => {
			document.head.removeChild(style)
		}
	}, [])

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
				>
					<Newspaper className="w-4 h-4" />
					Novedades
				</button>
			</Dialog.Trigger>
			<BaseDialog
				open={open}
				onOpenChange={setOpen}
				title={<><Newspaper className="w-4 h-4" /> Novedades</>}
				description="Novedades del sistema ReleaseHub"
				maxWidth="max-w-4xl"
			>
				{/* Content */}
				<div className="flex-1 overflow-y-auto custom-scrollbar prose prose-sm max-w-none dark:prose-invert">
					<Streamdown>{novedadesContent}</Streamdown>
				</div>
			</BaseDialog>
		</Dialog.Root>
	)
}
