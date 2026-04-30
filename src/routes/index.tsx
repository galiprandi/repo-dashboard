import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Star, Building2, FolderOpen, FolderPlus } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { DisplayInfo } from "@/components/DisplayInfo";
import { CommitLink } from "@/components/CommitLink";
import { TagLink } from "@/components/TagLink";
import { PromoteDialog } from "@/components/PromoteDialog";
import { ForceRedeployDialog } from "@/components/ForceRedeployDialog";
import { FreezeDialog } from "@/components/FreezeDialog";
import { useUserCollections } from "@/hooks/useUserCollections";
import { useUserRepos } from "@/hooks/useUserRepos";
import { useGitCommits } from "@/hooks/useGitCommits";
import { useGitTagsSimple } from "@/hooks/useGitTagsSimple";
import { usePipelineWithHealth } from "@/hooks/usePipelineWithHealth";

export const Route = createFileRoute("/")({
	component: Dashboard,
});

function Dashboard() {
	const { favorites, projects, activeTab, setActiveTab, toggleFavorite } = useUserCollections();
	const { isLoading: isLoadingRepos, data: reposData } = useUserRepos();

	const tabs = [
		{ id: "favorites", label: "Favoritos", icon: Star, count: favorites.length, description: "" },
		...projects.map(p => ({ id: p.id, label: p.name, icon: FolderOpen, count: p.repos.length, description: p.description })),
	];

	// Determine repos to show based on active tab
	let displayRepos: RepoInfo[] = [];
	if (activeTab === "favorites") {
		displayRepos = favorites
			.filter((f) => f.includes("/"))
			.map((f) => {
				const [org, name] = f.split("/");
				return { fullName: f, name, org, description: "", updatedAt: "" };
			});
	} else {
		const project = projects.find((p) => p.id === activeTab);
		if (project) {
			displayRepos = project.repos
				.filter((r) => r.includes("/"))
				.map((r) => {
					const [org, name] = r.split("/");
					return { fullName: r, name, org, description: "", updatedAt: "" };
				});
		}
	}

	// Group repos by organization
	const groupedRepos = displayRepos.reduce((acc, repo) => {
		if (!acc[repo.org]) acc[repo.org] = [];
		acc[repo.org].push(repo);
		return acc;
	}, {} as Record<string, RepoInfo[]>);

	const sortedOrgs = Object.keys(groupedRepos).sort();

	return (
		<div className="space-y-6">
			{/* Tabs */}
			<div className="flex gap-8 overflow-x-auto pb-4">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`flex flex-col items-start gap-2 group transition-all relative pb-2`}
							title={tab.description}
						>
							<div className="flex items-center gap-3">
								<Icon className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
								<span className={`text-lg tracking-tight font-black uppercase italic ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
									{tab.label}
								</span>
								{tab.count > 0 && (
									<span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
										isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
									}`}>
										{tab.count}
									</span>
								)}
							</div>
							{isActive && (
								<div className="absolute bottom-0 left-0 w-full h-1 bg-foreground animate-in slide-in-from-left duration-500" />
							)}
						</button>
					);
				})}
			</div>

			{/* Content */}
			{displayRepos.length === 0 ? (
				<div className="border rounded-xl p-12 text-center text-muted-foreground bg-muted/20 border-dashed">
					{activeTab === "favorites" ? (
						isLoadingRepos ? (
							<>
								<Loader2 className="w-10 h-10 mx-auto mb-4 opacity-40 animate-spin" />
								<h3 className="text-lg font-medium text-foreground mb-1">Cargando repositorios</h3>
								<p className="text-sm max-w-xs mx-auto">
									Consultando organizaciones y repositorios a los que tienes acceso...
								</p>
							</>
						) : (
							<>
								<Star className="w-10 h-10 mx-auto mb-4 opacity-20" />
								<h3 className="text-lg font-medium text-foreground mb-1">Sin favoritos</h3>
								<p className="text-sm max-w-xs mx-auto">
									Busca repositorios usando la barra superior para agregarlos a tu panel principal.
									{reposData && reposData.results.length > 0 && (
										<span className="block mt-2 text-xs text-muted-foreground/70">
											{reposData.results.length} repositorios disponibles
										</span>
									)}
								</p>
							</>
						)
					) : (
						<>
							<FolderPlus className="w-10 h-10 mx-auto mb-4 opacity-20" />
							<h3 className="text-lg font-medium text-foreground mb-1">Proyecto vacío</h3>
							<p className="text-sm max-w-xs mx-auto">
								Navega a un repositorio y agregalo a este proyecto desde la vista de detalle.
							</p>
						</>
					)}
				</div>
			) : (
				<div className="space-y-10">
					{sortedOrgs.map((org) => (
						<section key={org} className="space-y-3">
							<h2 className="text-lg font-semibold text-foreground px-4 flex items-center gap-2">
								<Building2 className="w-5 h-5" />
								{org}
							</h2>
							<ReposTable
								repos={groupedRepos[org]}
								favorites={favorites}
								onToggleFavorite={toggleFavorite}
							/>
						</section>
					))}
				</div>
			)}
		</div>
	);
}

function ReposTable({ repos, favorites, onToggleFavorite }: ReposTableProps) {
	// Ordenar repositorios alfabéticamente por name (ya que ya están filtrados por org)
	const sortedRepos = [...repos].sort((a, b) => a.name.localeCompare(b.name));

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-[1fr_100px_100px_150px_200px_150px] gap-4 px-8 py-2 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50">
				<span>Repositorio</span>
				<span>Tag</span>
				<span>Commit</span>
				<span>Fecha</span>
				<span>Autor</span>
				<span className="text-right">Acciones</span>
			</div>
			<div className="space-y-3">
				{sortedRepos.map((repo) => (
					<RepoRow
						key={repo.fullName}
						repo={repo}
						isFavorite={favorites.includes(repo.fullName)}
						onToggleFavorite={onToggleFavorite}
					/>
				))}
			</div>
		</div>
	);
}

// Función helper para determinar el estado del deploy basado en subevents de deploy
function getDeployStatus(events: { state: string; id: string; subevents?: { id: string; state: string }[] }[]) {
	if (!events || events.length === 0) return undefined;

	const lastEvent = events[events.length - 1];

	// Si el último evento no es CD (Despliegue), usar su estado
	if (lastEvent.id !== "CD") {
		return lastEvent.state;
	}

	// Filtrar solo subevents de deploy (DEPLOY_*)
	const deploySubevents = lastEvent.subevents?.filter((se: { id: string }) => se.id.startsWith("DEPLOY_")) || [];

	if (deploySubevents.length === 0) {
		return lastEvent.state;
	}

	// Determinar el estado basado en los subevents de deploy
	const hasFailed = deploySubevents.some((se: { state: string }) => se.state === "FAILED");
	const hasWarn = deploySubevents.some((se: { state: string }) => se.state === "WARN");
	const allSuccess = deploySubevents.every((se: { state: string }) => se.state === "SUCCESS");

	if (hasFailed) return "FAILED";
	if (hasWarn) return "WARN";
	if (allSuccess) return "SUCCESS";
	return lastEvent.state;
}

function RepoRow({ repo, isFavorite, onToggleFavorite }: RepoRowProps) {
	const [org, name] = repo.fullName.split("/");

	const { commits, latestCommit, isLoading: isLoadingCommits } = useGitCommits({
		repo: repo.fullName,
	});
	const { latestTag, isLoading: isLoadingTags } = useGitTagsSimple({
		repo: repo.fullName,
	});

	// Obtener estado del pipeline con extracción automática de endpoints para health monitor
	const stagingPipeline = usePipelineWithHealth({
		product: repo.fullName,
		commit: latestCommit?.hash ?? "",
		enabled: !!latestCommit?.hash,
	});

	const prodPipeline = usePipelineWithHealth({
		product: repo.fullName,
		commit: latestTag?.commit ?? "",
		tag: latestTag?.name ?? "",
		enabled: !!latestTag?.commit && !!latestTag?.name,
	});

	// Calculate pending commits (between production and staging)
	const pendingCount = (() => {
		if (!commits || !prodPipeline.data?.git?.commit) return 0;
		const prodCommitIndex = commits.findIndex(c => c.hash === prodPipeline.data!.git!.commit);
		if (prodCommitIndex === -1) return commits.length;
		return prodCommitIndex;
	})();

	const commitShortHash = latestCommit?.shortHash;
	const commitAuthor = latestCommit?.author;
	const commitDate = latestCommit?.date;

	// En el home solo usamos fecha del commit (tags simples no tienen fecha)
	const latestDate = commitDate;

	// Extraer información del pipeline para staging - usar el último evento (despliegue)
	const stagingStatus = stagingPipeline.data ? {
		status: getDeployStatus(stagingPipeline.data.events),
		updatedAt: stagingPipeline.data.updated_at,
		failedStage: stagingPipeline.data.events.find((e: { state: string }) => e.state === "FAILED")?.label.es,
		errorDetail: stagingPipeline.data.events.find((e: { state: string }) => e.state === "FAILED")?.markdown,
	} : { status: undefined };

	// Extraer información del pipeline para production - usar el último evento (despliegue)
	const productionStatus = prodPipeline.data ? {
		status: getDeployStatus(prodPipeline.data.events),
		updatedAt: prodPipeline.data.updated_at,
		failedStage: prodPipeline.data.events.find((e: { state: string }) => e.state === "FAILED")?.label.es,
		errorDetail: prodPipeline.data.events.find((e: { state: string }) => e.state === "FAILED")?.markdown,
	} : { status: undefined };

	const isLoading = isLoadingCommits || isLoadingTags;
	const isStagingLoading = stagingPipeline.isLoading;
	const isProdLoading = prodPipeline.isLoading;

	if (isLoading) {
		return (
			<div className="grid grid-cols-[1fr_100px_100px_150px_200px_150px] gap-4 items-center bg-card p-6 rounded-3xl opacity-50">
				<div className="flex items-center gap-4">
					<Link
						to="/product/$org/$product"
						params={{ org, product: name }}
						search={{ view: "commits" }}
						className="text-lg font-black tracking-tighter text-foreground"
					>
						{repo.fullName}
					</Link>
				</div>
				<div className="col-span-4 px-4 py-3">
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<Loader2 className="w-4 h-4 animate-spin" />
						Cargando...
					</div>
				</div>
				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={() => onToggleFavorite(repo.fullName)}
						className={`${isFavorite ? "text-yellow-500" : "text-muted-foreground"}`}
					>
						<Star className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-[1fr_100px_100px_150px_200px_150px] gap-4 items-center bg-card p-6 rounded-3xl hover:bg-muted/10 transition-all group shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-transparent hover:border-border/50">
			<div className="flex items-center gap-4">
				<Link
					to="/product/$org/$product"
					params={{ org, product: name }}
					search={{ view: "commits" }}
					className="text-lg font-black tracking-tighter text-foreground group-hover:text-primary transition-colors flex items-center gap-3"
				>
					<div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-150 transition-all duration-500" />
					{name}
				</Link>
				{pendingCount > 0 && (
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<span className="inline-flex items-center gap-1 text-[10px] bg-foreground text-background px-2.5 py-1 rounded-full font-black cursor-help">
									{pendingCount}
								</span>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-foreground text-background border-none px-3 py-2 rounded-xl shadow-2xl text-[10px] font-black uppercase tracking-wider z-50 animate-in fade-in zoom-in-95"
									sideOffset={8}
								>
									{pendingCount} PENDIENTES
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
					</Tooltip.Provider>
				)}
			</div>
			<div className="font-mono text-xs font-black tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
				{latestTag?.name && (
					<TagLink
						tagName={latestTag.name}
						org={org}
						repo={name}
						pipelineStatus={productionStatus}
						isLoading={isProdLoading}
					/>
				)}
			</div>
			<div className="font-mono text-xs font-black tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
				{commitShortHash && (
					<CommitLink
						hash={commitShortHash}
						org={org}
						repo={name}
						pipelineStatus={stagingStatus}
						isLoading={isStagingLoading}
					/>
				)}
			</div>
			<div className="text-[11px] font-black tracking-tighter uppercase opacity-30 group-hover:opacity-100 transition-opacity whitespace-nowrap">
				<DisplayInfo type="dates" value={latestDate} />
			</div>
			<div className="text-[11px] font-black tracking-tighter uppercase truncate opacity-30 group-hover:opacity-100 transition-opacity">
				<DisplayInfo type="author" value={commitAuthor} hideTooltip={true} />
			</div>
			<div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
				<FreezeDialog repo={repo.fullName} iconOnly={true} />
				<ForceRedeployDialog repo={repo.fullName} iconOnly={true} />
				<PromoteDialog repo={repo.fullName} latestTag={latestTag?.name} iconOnly={true} />
				<div className="w-px h-6 bg-border mx-2" />
				<button
					type="button"
					onClick={() => onToggleFavorite(repo.fullName)}
					className={`p-2.5 rounded-2xl transition-all ${isFavorite ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/5"}`}
				>
					<Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
				</button>
			</div>
		</div>
	);
}

type RepoInfo = {
	fullName: string;
	name: string;
	org: string;
	description: string;
	updatedAt: string;
};
type ReposTableProps = {
	repos: RepoInfo[];
	favorites: string[];
	onToggleFavorite: (product: string) => void;
};
type RepoRowProps = {
	repo: RepoInfo;
	isFavorite: boolean;
	onToggleFavorite: (product: string) => void;
};
