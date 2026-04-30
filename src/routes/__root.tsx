import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Github, Star, Activity } from "lucide-react";
import { useEffect } from "react";
import { RepoSearch } from "@/components/RepoSearch";
import { NovedadesDialog } from "@/components/NovedadesDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useGitUser } from "@/hooks/useGitUser";
import { useGhCliSetup } from "@/hooks/useGhCliSetup";
import { useUserCollections } from "@/hooks/useUserCollections";

function UserAvatar() {
	const { data: user, isLoading } = useGitUser();

	if (isLoading) {
		return (
			<div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
		);
	}

	if (user?.avatar_url) {
		return (
			<img
				src={user.avatar_url}
				alt={user.name || "Usuario"}
				className="w-8 h-8 rounded-full"
			/>
		);
	}

	const initials = user?.name
		? user.name
				.split(" ")
				.map((n: string) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	return (
		<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
			{initials}
		</div>
	);
}

function RootLayout() {
	const { isInstalled, isAuthenticated, isLoading } = useGhCliSetup();
	const navigate = useNavigate();
	const routerState = useRouterState();
	const { isFavorite, toggleFavorite } = useUserCollections();

	// Extract product name from route if on product page
	const pathname = routerState.location.pathname;
	const productMatch = pathname.match(/\/product\/([^/]+)\/([^/]+)/);
	const org = productMatch ? productMatch[1] : null;
	const product = productMatch ? productMatch[2] : null;
	const fullProduct = org && product ? `${org}/${product}` : null;
	const favorite = fullProduct ? isFavorite(fullProduct) : false;

	// Detect if on health page
	const isHealthPage = pathname === '/health';

	useEffect(() => {
		// Si gh cli no está instalado o no está autenticado, redirigir a setup
		if (!isLoading && (!isInstalled || !isAuthenticated)) {
			navigate({ to: "/setup" });
		}
	}, [isInstalled, isAuthenticated, isLoading, navigate]);

	return (
		<>
			<div className="min-h-screen bg-background flex flex-col">
				<header className="sticky top-0 z-50 w-full bg-background/50 backdrop-blur-xl px-6 py-6 transition-all duration-300">
					<div className="flex items-center justify-between max-w-[1400px] mx-auto w-full">
						<div className="flex items-center gap-8">
							<Link to="/" className="text-xl font-black tracking-tighter hover:text-primary flex items-center gap-3 transition-all">
								<div className="bg-foreground text-background p-2 rounded-2xl shadow-2xl">
									<Github className="w-5 h-5" />
								</div>
								<span className="uppercase italic">ReleaseHub</span>
							</Link>
							{(product || isHealthPage) && (
								<>
									<div className="h-6 w-px bg-border mx-1" />
									<div className="flex items-center gap-2 text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
										{isHealthPage && <Activity className="w-4 h-4 text-blue-600" />}
										{product && (
											<button
												type="button"
												onClick={() => fullProduct && toggleFavorite(fullProduct)}
												className={`${favorite ? "text-yellow-500" : "text-muted-foreground"} hover:text-yellow-600 transition-colors p-1 hover:bg-muted rounded-md`}
												title={favorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
											>
												<Star className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
											</button>
										)}
										<span className="text-sm font-medium">
											{isHealthPage ? 'Health Monitor' : product}
										</span>
									</div>
								</>
							)}
						</div>
						<div className="flex items-center gap-6">
							<div className="hidden lg:block">
								<RepoSearch />
							</div>
							<div className="flex items-center gap-2 bg-muted/30 p-1 rounded-2xl border border-border/50">
								<NovedadesDialog />
								<Link
									to="/health"
									className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-background rounded-xl transition-all active:scale-90"
									title="Health Monitor"
								>
									<Activity className="w-5 h-5" />
								</Link>
								<div className="flex items-center gap-3 pl-2 pr-1">
									<UserAvatar />
									<SettingsDialog />
								</div>
							</div>
						</div>
					</div>
				</header>
				<main className="px-6 py-12 flex-1 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-1000">
					<Outlet />
				</main>
				<footer className="p-6 pt-0 border-t mt-12">
					<div className="max-w-[1600px] mx-auto flex items-center justify-between">
						<p className="text-xs text-muted-foreground">
							&copy; {new Date().getFullYear()} ReleaseHub. Gestión de pipelines simplificada.
						</p>
						<a
							href="https://github.com/galiprandi/release-hub"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
						>
							<Github className="w-3.5 h-3.5" />
							Open Source
						</a>
					</div>
				</footer>
			</div>
			<TanStackRouterDevtools />
		</>
	);
}

export const Route = createRootRoute({
	component: RootLayout,
});
