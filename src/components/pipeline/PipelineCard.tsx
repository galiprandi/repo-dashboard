import { Loader2 } from 'lucide-react'
import type { MetaPart, StageType } from './types'
import { stageStyles } from './helpers'

export interface PipelineCardProps {
	stage: StageType
	displayRef: string
	refType: 'COMMIT' | 'TAG'
	isRunning?: boolean
	metaParts: MetaPart[]
	children?: React.ReactNode
	className?: string
}

export function PipelineCard({
	stage,
	displayRef,
	refType,
	isRunning = false,
	metaParts,
	children,
	className = '',
}: PipelineCardProps) {
	const stageStyle = stageStyles[stage]

	return (
		<div
			className={`bg-card border rounded-xl p-4 transition-all duration-500 ${
				isRunning ? 'ring-1 ring-blue-400/20 bg-blue-50/5 dark:bg-blue-900/5' : ''
			} ${className}`}
		>
			<div className="flex items-start gap-4">
				<div
					className={`w-1 rounded-full self-stretch ${
						isRunning ? 'bg-blue-400 animate-pulse-slow' : stageStyle.accent
					}`}
				/>
				<div className="flex-1 min-w-0 space-y-1.5">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<span className="font-mono text-base font-semibold text-foreground">{displayRef}</span>
							<span className={`px-1.5 py-0 text-[10px] rounded uppercase tracking-wide ${stageStyle.badge}`}>
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
