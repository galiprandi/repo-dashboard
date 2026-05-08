import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

interface DialogCloseButtonProps {
	className?: string
}

export function DialogCloseButton({ className = "" }: DialogCloseButtonProps) {
	return (
		<Dialog.Close asChild>
			<button
				type="button"
				className={`rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
			>
				<X className="w-4 h-4" />
				<span className="sr-only">Cerrar</span>
			</button>
		</Dialog.Close>
	)
}
