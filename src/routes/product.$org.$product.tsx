import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$org/$product")({
	component: ProductLayout,
});

function ProductLayout() {
	return (
		<div className="px-4">
			{/* Child Routes Render Here */}
			<Outlet />
		</div>
	);
}
