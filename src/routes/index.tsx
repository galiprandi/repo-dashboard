import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Star, Github, Building2, GitPullRequestCreateArrow, FolderOpen, FolderPlus } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { DisplayInfo } from "@/components/DisplayInfo";
import { CommitLink } from "@/components/CommitLink";
import { TagLink } from "@/components/TagLink";
import { PromoteDialog } from "@/components/PromoteDialog";
import { ForceRedeployDialog } from "@/components/ForceRedeployDialog";
import { FreezeDialog } from "@/components/FreezeDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useProjects } from "@/hooks/useProjects";
import { useGitCommits } from "@/hooks/useGitCommits";
import { useGitTagsSimple } from "@/hooks/useGitTagsSimple";
import { usePipelineWithHealth } from "@/hooks/usePipelineWithHealth";

export const Route = createFileRoute("/")({
	component: Dashboard,
});

function Dashboard() {
	const { favorites, toggleFavorite } = useFavorites();
	const { projects, activeTab, setActiveTab } = useProjects();

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
			<div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${
								isActive
									? "bg-white shadow-sm text-foreground font-medium"
									: "text-muted-foreground hover:text-foreground"
							}`}
							title={tab.description}
						>
							<Icon className="w-4 h-4" />
							{tab.label}
							{tab.count > 0 && (
								<span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
									{tab.count}
								</span>
								)}
						</button>
					);
				})}
			</div>

			{/* Content */}
			{displayRepos.length === 0 ? (
				<div className="border rounded-xl p-12 text-center text-muted-foreground bg-muted/20 border-dashed">
					{activeTab === "favorites" ? (
						<>
							<Star className="w-10 h-10 mx-auto mb-4 opacity-20" />
							<h3 className="text-lg font-medium text-foreground mb-1">Sin favoritos</h3>
							<p className="text-sm max-w-xs mx-auto">
								Busca repositorios usando la barra superior para agregarlos a tu panel principal.
							</p>
						</>
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
		<div className="border rounded-lg overflow-hidden">
			<table className="w-full">
				<thead className="bg-muted">
					<tr>
						<th className="px-4 py-2 text-left text-sm font-medium w-auto">
							Repositorio
						</th>
						<th className="px-4 py-2 text-left text-sm font-medium w-20">Tag</th>
						<th className="px-4 py-2 text-left text-sm font-medium w-20">Commit</th>
						<th className="px-4 py-2 text-left text-sm font-medium w-36">
							Actualización
						</th>
						<th className="px-4 py-2 text-left text-sm font-medium" style={{ width: '250px' }}>Autor</th>
						<th className="px-4 py-2 text-center text-sm font-medium w-16">
							Acciones
						</th>
					</tr>
				</thead>
				<tbody>
					{sortedRepos.map((repo) => (
						<RepoRow
							key={repo.fullName}
							repo={repo}
							isFavorite={favorites.includes(repo.fullName)}
							onToggleFavorite={onToggleFavorite}
						/>
					))}
				</tbody>
			</table>
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
			<tr className="border-t">
				<td className="px-4 py-3 w-auto">
					<Link
						to="/product/$org/$product"
						params={{ org, product: name }}
						search={{ view: "commits" }}
						className="font-medium hover:text-primary"
					>
						{repo.fullName}
					</Link>
				</td>
				<td colSpan={4} className="px-4 py-3">
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<Loader2 className="w-4 h-4 animate-spin" />
						Cargando información...
					</div>
				</td>
				<td className="px-4 py-3 text-center w-16">
					<div className="flex items-center justify-center gap-2">
						<a
							href={`https://github.com/${org}/${name}`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-primary"
							title="Abrir en GitHub"
						>
							<Github className="w-5 h-5" />
						</a>
						<button
							type="button"
							onClick={() => onToggleFavorite(repo.fullName)}
							className={`${isFavorite ? "text-yellow-500" : "text-muted-foreground"} hover:text-yellow-600`}
							title={isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
						>
							<Star className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
						</button>
					</div>
				</td>
			</tr>
		);
	}

	return (
		<tr className="border-t hover:bg-muted/50">
			<td className="px-4 py-3 w-auto">
				<div className="flex items-center gap-2">
					<Link
						to="/product/$org/$product"
						params={{ org, product: name }}
						search={{ view: "commits" }}
						className="font-medium hover:text-primary"
					>
						{name}
					</Link>
					{pendingCount > 0 && (
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<span className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200 font-medium cursor-help">
									<GitPullRequestCreateArrow className="w-3 h-3" />
									{pendingCount}
								</span>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									className="bg-popover text-popover-foreground border px-2 py-1 rounded-md shadow-md text-xs z-50"
									sideOffset={5}
								>
									{pendingCount} commit{pendingCount !== 1 ? 's' : ''} pendientes de promoción a producción
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
					</Tooltip.Provider>
				)}
				</div>
			</td>
			<td className="px-4 py-3 w-20">
				{latestTag?.name && (
					<TagLink
						tagName={latestTag.name}
						org={org}
						repo={name}
						pipelineStatus={productionStatus}
						isLoading={isProdLoading}
					/>
				)}
			</td>
			<td className="px-4 py-3 w-20">
				{commitShortHash && (
					<CommitLink
						hash={commitShortHash}
						org={org}
						repo={name}
						pipelineStatus={stagingStatus}
						isLoading={isStagingLoading}
					/>
				)}
			</td>
			<td className="px-4 py-3 text-sm text-muted-foreground w-36">
				<div className="flex items-center gap-1">
					<DisplayInfo type="dates" value={latestDate} />
				</div>
			</td>
			<td className="px-4 py-3 text-sm" style={{ width: '250px' }}>
				<div className="truncate" title={commitAuthor || undefined}>
					<DisplayInfo type="author" value={commitAuthor} hideTooltip={true} />
				</div>
			</td>
			<td className="px-4 py-3 text-center w-16">
				<div className="flex items-center justify-center gap-2">
					<FreezeDialog repo={repo.fullName} iconOnly={true} />
					<ForceRedeployDialog repo={repo.fullName} iconOnly={true} />
					<PromoteDialog repo={repo.fullName} latestTag={latestTag?.name} iconOnly={true} />
					<a
						href={`https://github.com/${org}/${name}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground hover:text-primary"
						title="Abrir en GitHub"
					>
						<Github className="w-5 h-5" />
					</a>
					<button
						type="button"
						onClick={() => onToggleFavorite(repo.fullName)}
						className={`${isFavorite ? "text-yellow-500" : "text-muted-foreground"} hover:text-yellow-600`}
						title={isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
					>
						<Star className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
					</button>
				</div>
			</td>
		</tr>
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
