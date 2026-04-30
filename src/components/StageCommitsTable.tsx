import { useEffect, useRef } from "react";
import { type GitCommit, useGitCommits } from "@/hooks/useGitCommits";
import { type GitTag, useGitTags } from "@/hooks/useGitTags";
import { DisplayInfo } from "./DisplayInfo";
import { CommitLink } from "./CommitLink";
import { TagLink } from "./TagLink";
import { Loader2 } from "lucide-react";


interface StageCommitsTableProps {
	viewMode: "commits" | "tags";
	org: string;
	product: string;
	showStatus?: boolean;
}

export function StageCommitsTable({
	viewMode,
	org,
	product,
	showStatus = true,
}: StageCommitsTableProps) {
	const fullRepo = `${org}/${product}`;
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const { 
		commits, 
		isLoading: isLoadingCommits, 
		hasNextPage: hasNextPageCommits, 
		fetchNextPage: fetchNextPageCommits, 
		isFetchingNextPage: isFetchingNextPageCommits 
	} = useGitCommits({
		repo: fullRepo,
		enabled: viewMode === "commits",
	});

	const { 
		tags, 
		isLoading: isLoadingTags, 
		hasNextPage: hasNextPageTags, 
		fetchNextPage: fetchNextPageTags, 
		isFetchingNextPage: isFetchingNextPageTags 
	} = useGitTags({
		repo: fullRepo,
		enabled: viewMode === "tags",
	});

	const isCommits = viewMode === "commits";
	const isLoading = isCommits ? isLoadingCommits : isLoadingTags;
	const hasNextPage = isCommits ? hasNextPageCommits : hasNextPageTags;
	const fetchNextPage = isCommits ? fetchNextPageCommits : fetchNextPageTags;
	const isFetchingNextPage = isCommits ? isFetchingNextPageCommits : isFetchingNextPageTags;

	// Infinite scroll implementation
	useEffect(() => {
		if (!hasNextPage || isFetchingNextPage) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 }
		);

		const currentRef = loadMoreRef.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
			observer.disconnect();
		};
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	return (
		<div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
			<div className="space-y-4">
				<div className="grid grid-cols-[150px_150px_200px_1fr] gap-4 px-10 py-2 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40">
					<span>{isCommits ? "Hash" : "Tag"}</span>
					<span>Fecha</span>
					<span>Autor</span>
					{isCommits && <span>Mensaje</span>}
				</div>
				<div className="space-y-2">
						{isLoading && (!commits?.length && !tags?.length) ? (
							<div className="bg-card p-12 rounded-[2rem] text-center text-muted-foreground">
								<div className="flex flex-col items-center justify-center gap-4">
									<Loader2 className="w-8 h-8 animate-spin text-foreground" />
									<span className="text-sm font-black uppercase tracking-widest italic">Cargando historial...</span>
								</div>
							</div>
						) : isCommits ? (
							commits?.map((c: GitCommit) => (
								<div key={c.hash} className="grid grid-cols-[150px_150px_200px_1fr] gap-4 items-center bg-card p-6 rounded-[2rem] hover:bg-muted/10 transition-all group border border-transparent hover:border-border/50">
									<div className="font-mono text-sm font-black tracking-tighter italic">
										<CommitLink hash={c.hash} org={org} repo={product} showStatus={showStatus} />
									</div>
									<div className="text-[11px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
										<DisplayInfo value={c.date} type="dates" />
									</div>
									<div className="text-[11px] font-black uppercase tracking-tighter truncate opacity-40 group-hover:opacity-100 transition-opacity">
										<DisplayInfo value={c.author} type="author" maxChar={30} />
									</div>
									<div className="text-sm font-medium text-muted-foreground truncate">
										<DisplayInfo
											value={c.message}
											type="message"
											maxChar={100}
										/>
									</div>
								</div>
							))
						) : (
							tags
								?.map((t: GitTag) => (
									<div key={t.name} className="grid grid-cols-[150px_150px_200px_1fr] gap-4 items-center bg-card p-6 rounded-[2rem] hover:bg-muted/10 transition-all group border border-transparent hover:border-border/50">
										<div className="font-mono text-sm font-black tracking-tighter italic">
											<TagLink tagName={t.name} org={org} repo={product} showStatus={showStatus} />
										</div>
										<div className="text-[11px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
											<DisplayInfo value={t.date} type="dates" />
										</div>
										<div className="text-[11px] font-black uppercase tracking-tighter truncate opacity-40 group-hover:opacity-100 transition-opacity">
											<DisplayInfo
												value={t.author.name}
												type="author"
												maxChar={50}
											/>
										</div>
										<div />
									</div>
								))
						)}
					</div>
				
				{/* Infinite scroll sensor */}
				<div ref={loadMoreRef} className="flex items-center justify-center py-4 border-t text-xs text-muted-foreground">
					{isFetchingNextPage ? (
						<div className="flex items-center gap-2">
							<Loader2 className="w-3 h-3 animate-spin" />
							Cargando más...
						</div>
					) : hasNextPage ? (
						"Desliza para cargar más"
					) : (
						commits?.length || tags?.length ? "Fin del historial" : ""
					)}
				</div>
			</div>
		</div>
	);
}

