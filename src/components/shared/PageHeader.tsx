import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
	icon: LucideIcon;
	title: string;
}

export function PageHeader({ icon: Icon, title }: PageHeaderProps) {
	return (
		<div className="flex items-center gap-3">
			<div className="p-2 rounded-lg bg-primary/10">
				<Icon className="w-6 h-6 text-primary" />
			</div>
			<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
		</div>
	);
}
