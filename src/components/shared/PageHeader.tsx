import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
	icon: LucideIcon;
	title: string;
}

export function PageHeader({ icon: Icon, title }: PageHeaderProps) {
	return (
		<div className="flex items-center gap-3">
			<Icon className="w-6 h-6 text-blue-600" />
			<h1 className="text-2xl font-bold">{title}</h1>
		</div>
	);
}
