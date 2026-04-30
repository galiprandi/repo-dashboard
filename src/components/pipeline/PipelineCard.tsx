import { Loader2 } from 'lucide-react'
import type { MetaPart, ViewMode } from './types'
import { viewModeStyles } from './helpers'

export interface PipelineCardProps {
	viewMode: ViewMode
	displayRef: string
	refType: 'COMMIT' | 'TAG'
	isRunning?: boolean
	metaParts: MetaPart[]
	children?: React.ReactNode
	className?: string
}

export function PipelineCard({
	viewMode,
	displayRef,
	refType,
	isRunning = false,
	metaParts,
	children,
	className = '',
}: PipelineCardProps) {
	const style = viewModeStyles[viewMode]

	return (
		<div
			className={`bg-card border-none rounded-[2.5rem] p-10 transition-all duration-700 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] ${
				isRunning ? 'ring-4 ring-blue-400/10 bg-blue-50/5' : ''
			} ${className}`}
		>
			<div className="flex items-start gap-4">
				<div
					className={`w-1 rounded-full self-stretch ${
						isRunning ? 'bg-blue-400 animate-pulse-slow' : style.accent
					}`}
				/>
				<div className="flex-1 min-w-0 space-y-1.5">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-4">
							<span className="font-mono text-2xl font-black text-foreground tracking-tighter italic">{displayRef}</span>
							<span className={`px-3 py-1 text-[10px] rounded-full font-black uppercase tracking-[0.2em] ${style.badge}`}>
								{refType}
							</span>
							{isRunning && (
								<span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md animate-pulse-slow">
									<Loader2 className="w-3 h-3 animate-spin" />
									EN PROGRESO
								</span>
							)}
						</div>
						{children && <div className="self-start">{children}</div>}
					</div>
					{metaParts.length > 0 && (
						<div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
							{metaParts.map(({ id, node }, index) => (
								<span key={id}>
									{index > 0 && <span className="mx-2">·</span>}
									{node}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
