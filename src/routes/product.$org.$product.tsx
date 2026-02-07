import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export const Route = createFileRoute("/product/$org/$product")({
	component: ProductLayout,
});

function ProductLayout() {
	const { org, product } = Route.useParams();
	const fullProduct = `${org}/${product}`;
	const { isFavorite, toggleFavorite } = useFavorites();
	const favorite = isFavorite(fullProduct);

	return (
		<div className="max-w-6xl mx-auto px-6 py-8">
			{/* Minimal Header */}
			<div className="flex items-center gap-4 mb-10">
				<Link
					to="/"
					className="text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => toggleFavorite(fullProduct)}
						className="text-muted-foreground hover:text-yellow-400 transition-colors"
					>
						<Star
							className={`w-5 h-5 ${favorite ? "fill-yellow-400 text-yellow-400" : ""}`}
						/>
					</button>
					<h1 className="text-xl font-medium tracking-tight">{fullProduct}</h1>
				</div>
			</div>

			{/* Child Routes Render Here */}
			<Outlet />
		</div>
	);
}
