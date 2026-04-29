import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Project {
	id: string;
	name: string;
	description: string;
	repos: string[];
}

export interface UserCollections {
	favorites: string[];
	projects: Project[];
	activeTab: string;
}

const COLLECTIONS_KEY = ["user", "collections"];

function getInitialCollections(): UserCollections {
	return { favorites: [], projects: [], activeTab: "favorites" };
}

export function useUserCollections() {
	const queryClient = useQueryClient();

	const { data = getInitialCollections() } = useQuery<UserCollections>({
		queryKey: COLLECTIONS_KEY,
		queryFn: () => {
			const cached = queryClient.getQueryData<UserCollections>(COLLECTIONS_KEY);
			return cached || getInitialCollections();
		},
		staleTime: Infinity,
		gcTime: Infinity,
	});

	const mutate = useMutation({
		mutationFn: (next: UserCollections) => Promise.resolve(next),
		onMutate: async (next) => {
			await queryClient.cancelQueries({ queryKey: COLLECTIONS_KEY });
			const previous = queryClient.getQueryData<UserCollections>(COLLECTIONS_KEY);
			queryClient.setQueryData(COLLECTIONS_KEY, next);
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				queryClient.setQueryData(COLLECTIONS_KEY, context.previous);
			}
		},
	});

	const setCollections = mutate.mutate;

	/* ---------- Favorites ---------- */
	const toggleFavorite = useCallback(
		(product: string) => {
			const next = { ...data };
			if (next.favorites.includes(product)) {
				next.favorites = next.favorites.filter((f) => f !== product);
			} else {
				next.favorites = [...next.favorites, product];
			}
			setCollections(next);
		},
		[data, setCollections]
	);

	const isFavorite = useCallback(
		(product: string) => data.favorites.includes(product),
		[data.favorites]
	);

	/* ---------- Projects ---------- */
	const createProject = useCallback(
		(name: string, description: string, initialRepos?: string[]) => {
			const id = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, "");
			if (data.projects.some((p) => p.id === id)) return id;
			const next = {
				...data,
				projects: [
					...data.projects,
					{
						id,
						name,
						description: description || "",
						repos: initialRepos || [],
					},
				],
			};
			setCollections(next);
			return id;
		},
		[data, setCollections]
	);

	const updateProject = useCallback(
		(id: string, updates: Partial<Omit<Project, "id">>) => {
			const next = {
				...data,
				projects: data.projects.map((p) =>
					p.id === id ? { ...p, ...updates } : p
				),
			};
			setCollections(next);
		},
		[data, setCollections]
	);

	const deleteProject = useCallback(
		(id: string) => {
			const next = {
				...data,
				projects: data.projects.filter((p) => p.id !== id),
				activeTab: data.activeTab === id ? "favorites" : data.activeTab,
			};
			setCollections(next);
		},
		[data, setCollections]
	);

	const addRepoToProject = useCallback(
		(projectId: string, repo: string) => {
			const next = {
				...data,
				projects: data.projects.map((p) =>
					p.id === projectId && !p.repos.includes(repo)
						? { ...p, repos: [...p.repos, repo] }
						: p
				),
			};
			setCollections(next);
		},
		[data, setCollections]
	);

	const removeRepoFromProject = useCallback(
		(projectId: string, repo: string) => {
			const next = {
				...data,
				projects: data.projects.map((p) =>
					p.id === projectId
						? { ...p, repos: p.repos.filter((r) => r !== repo) }
						: p
				),
			};
			setCollections(next);
		},
		[data, setCollections]
	);

	const toggleRepoInProject = useCallback(
		(projectId: string, repo: string) => {
			const next = {
				...data,
				projects: data.projects.map((p) => {
					if (p.id !== projectId) return p;
					const hasRepo = p.repos.includes(repo);
					return {
						...p,
						repos: hasRepo
							? p.repos.filter((r) => r !== repo)
							: [...p.repos, repo],
					};
				}),
			};
			setCollections(next);
		},
		[data, setCollections]
	);

	const getProjectsForRepo = useCallback(
		(repo: string) => data.projects.filter((p) => p.repos.includes(repo)),
		[data.projects]
	);

	const isRepoInProject = useCallback(
		(projectId: string, repo: string) =>
			data.projects.some(
				(p) => p.id === projectId && p.repos.includes(repo)
			),
		[data.projects]
	);

	/* ---------- Active tab ---------- */
	const setActiveTab = useCallback(
		(tab: string) => {
			setCollections({ ...data, activeTab: tab });
		},
		[data, setCollections]
	);

	return {
		favorites: data.favorites,
		projects: data.projects,
		activeTab: data.activeTab,
		toggleFavorite,
		isFavorite,
		createProject,
		updateProject,
		deleteProject,
		addRepoToProject,
		removeRepoFromProject,
		toggleRepoInProject,
		getProjectsForRepo,
		isRepoInProject,
		setActiveTab,
	};
}
