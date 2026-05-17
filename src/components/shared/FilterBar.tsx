import type { ReactNode } from 'react';

interface FilterOption {
	value: string;
	label: string;
}

interface FilterBarProps {
	filters: FilterOption[];
	activeFilter: string;
	onFilterChange: (value: string) => void;
	searchPlaceholder: string;
	searchValue: string;
	onSearchChange: (value: string) => void;
	rightContent?: ReactNode;
}

export function FilterBar({
	filters,
	activeFilter,
	onFilterChange,
	searchPlaceholder,
	searchValue,
	onSearchChange,
	rightContent,
}: FilterBarProps) {
	return (
		<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
					{filters.map((filter) => (
						<button
							key={filter.value}
							type="button"
							onClick={() => onFilterChange(filter.value)}
							aria-pressed={activeFilter === filter.value}
							className={`px-3 py-1 text-sm rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 ${
								activeFilter === filter.value
									? 'bg-primary text-primary-foreground font-medium'
									: 'bg-muted text-muted-foreground hover:bg-muted/80'
							}`}
						>
							{filter.label}
						</button>
					))}
				</div>

				<div>
					<input
						type="text"
						placeholder={searchPlaceholder}
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						className="px-3 py-1.5 text-sm border border-input bg-background rounded-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 placeholder:text-muted-foreground"
					/>
				</div>
			</div>

			{rightContent && <div className="flex gap-2">{rightContent}</div>}
		</div>
	);
}
