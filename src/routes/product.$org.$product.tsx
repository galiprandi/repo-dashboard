import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$org/$product")({
	component: ProductLayout,
	validateSearch: (search: Record<string, unknown>) => ({
		view: search.view === "tags" ? "tags" : "commits",
	}),
});

function ProductLayout() {
	return (
		<div className="px-4">
			{/* Child Routes Render Here */}
			<Outlet />
		</div>
	);
}
