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
					<span className="text-sm font-medium text-gray-600">Filtrar:</span>
					{filters.map((filter) => (
						<button
							key={filter.value}
							onClick={() => onFilterChange(filter.value)}
							className={`px-3 py-1 text-sm rounded-md transition-colors ${
								activeFilter === filter.value
									? 'bg-blue-600 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
						className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>

			{rightContent && <div className="flex gap-2">{rightContent}</div>}
		</div>
	);
}
