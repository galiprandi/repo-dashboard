import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Github, Star } from "lucide-react";
import { useEffect } from "react";
import { RepoSearch } from "@/components/RepoSearch";
import { NovedadesDialog } from "@/components/NovedadesDialog";
import { useGitUser } from "@/hooks/useGitUser";
import { useGhCliSetup } from "@/hooks/useGhCliSetup";
import { useFavorites } from "@/hooks/useFavorites";

function UserAvatar() {
	const { data: user, isLoading } = useGitUser();

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
				<span>Cargando información...</span>
			</div>
		);
	}

	const displayName = user?.name
		? user.name.length > 17
			? user.name.slice(0, 17) + "..."
			: user.name
		: "Sin nombre";

	if (user?.avatar_url) {
		return (
			<div className="flex items-center gap-2">
				<img
					src={user.avatar_url}
					alt={displayName}
					className="w-8 h-8 rounded-full"
				/>
				<span className="text-sm font-medium hidden sm:inline">
					{displayName}
				</span>
			</div>
		);
	}

	const initials = displayName
		? displayName
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	return (
		<div className="flex items-center gap-2">
			<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
				{initials}
			</div>
			<span className="text-sm font-medium hidden sm:inline">
				{displayName}
			</span>
		</div>
	);
}

function RootLayout() {
	const { isInstalled, isAuthenticated, isLoading } = useGhCliSetup();
	const navigate = useNavigate();
	const routerState = useRouterState();
	const { isFavorite, toggleFavorite } = useFavorites();

	// Extract product name from route if on product page
	const pathname = routerState.location.pathname;
	const productMatch = pathname.match(/\/product\/([^/]+)\/([^/]+)/);
	const org = productMatch ? productMatch[1] : null;
	const product = productMatch ? productMatch[2] : null;
	const fullProduct = org && product ? `${org}/${product}` : null;
	const favorite = fullProduct ? isFavorite(fullProduct) : false;

	useEffect(() => {
		// Si gh cli no está instalado o no está autenticado, redirigir a setup
		if (!isLoading && (!isInstalled || !isAuthenticated)) {
			navigate({ to: "/setup" });
		}
	}, [isInstalled, isAuthenticated, isLoading, navigate]);

	return (
		<>
			<div className="min-h-screen bg-background flex flex-col">
				<header className="border-b px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Link to="/" className="text-2xl font-bold hover:text-primary flex items-center gap-2">
								<Github className="w-6 h-6" />
								ReleaseHub
							</Link>
							{product && (
								<>
									<span className="text-muted-foreground text-lg">/</span>
									<span className="text-lg font-normal text-muted-foreground">{product}</span>
									<button
										type="button"
										onClick={() => fullProduct && toggleFavorite(fullProduct)}
										className={`${favorite ? "text-yellow-500" : "text-muted-foreground"} hover:text-yellow-600`}
										title={favorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
									>
										<Star className={`w-5 h-5 ${favorite ? "fill-current" : ""}`} />
									</button>
								</>
							)}
						</div>
						<div className="flex items-center gap-4">
							<NovedadesDialog />
							<RepoSearch />
							<UserAvatar />
						</div>
					</div>
				</header>
				<main className="p-4 pt-8 flex-1">
					<Outlet />
				</main>
				<footer className="p-4 pt-0 text-right">
					<a
						href="https://github.com/galiprandi/release-hub"
						target="_blank"
						rel="noopener noreferrer"
						className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
					>
						ReleaseHub Open Source
					</a>
				</footer>
			</div>
			<TanStackRouterDevtools />
		</>
	);
}

export const Route = createRootRoute({
	component: RootLayout,
});
