import { useCallback, useEffect, useState } from "react";

const PROJECTS_STORAGE_KEY = "seki:projects:v1";
const ACTIVE_TAB_STORAGE_KEY = "seki:home-tab:v1";

export interface Project {
	id: string;
	name: string;
	description: string;
	repos: string[];
}

function getInitialProjects(): Project[] {
	if (typeof window === "undefined") return [];
	const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
	if (!stored) return [];
	try {
		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function getInitialActiveTab(): string {
	if (typeof window === "undefined") return "favorites";
	const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
	return stored || "favorites";
}

export function useProjects() {
	const [projects, setProjects] = useState<Project[]>(getInitialProjects);
	const [activeTab, setActiveTabState] = useState<string>(getInitialActiveTab);

	// Persist projects
	useEffect(() => {
		localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
	}, [projects]);

	// Persist active tab
	useEffect(() => {
		localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
	}, [activeTab]);

	const createProject = useCallback(
		(name: string, description: string, initialRepos?: string[]) => {
			const id = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, "");
			const newProject: Project = {
				id,
				name,
				description,
				repos: initialRepos || [],
			};
			setProjects((prev) => {
				if (prev.some((p) => p.id === id)) return prev;
				return [...prev, newProject];
			});
			return id;
		},
		[]
	);

	const updateProject = useCallback(
		(id: string, updates: Partial<Omit<Project, "id">>) => {
			setProjects((prev) =>
				prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
			);
		},
		[]
	);

	const deleteProject = useCallback((id: string) => {
		setProjects((prev) => prev.filter((p) => p.id !== id));
	}, []);

	const addRepoToProject = useCallback((projectId: string, repo: string) => {
		setProjects((prev) =>
			prev.map((p) =>
				p.id === projectId && !p.repos.includes(repo)
					? { ...p, repos: [...p.repos, repo] }
					: p
			)
		);
	}, []);

	const removeRepoFromProject = useCallback(
		(projectId: string, repo: string) => {
			setProjects((prev) =>
				prev.map((p) =>
					p.id === projectId
						? { ...p, repos: p.repos.filter((r) => r !== repo) }
						: p
				)
			);
		},
		[]
	);

	const toggleRepoInProject = useCallback(
		(projectId: string, repo: string) => {
			setProjects((prev) =>
				prev.map((p) => {
					if (p.id !== projectId) return p;
					const hasRepo = p.repos.includes(repo);
					return {
						...p,
						repos: hasRepo
							? p.repos.filter((r) => r !== repo)
							: [...p.repos, repo],
					};
				})
			);
		},
		[]
	);

	const getProjectsForRepo = useCallback(
		(repo: string) => {
			return projects.filter((p) => p.repos.includes(repo));
		},
		[projects]
	);

	const isRepoInProject = useCallback(
		(projectId: string, repo: string) => {
			return projects.some(
				(p) => p.id === projectId && p.repos.includes(repo)
			);
		},
		[projects]
	);

	const setActiveTab = useCallback((tab: string) => {
		setActiveTabState(tab);
	}, []);

	return {
		projects,
		activeTab,
		setActiveTab,
		createProject,
		updateProject,
		deleteProject,
		addRepoToProject,
		removeRepoFromProject,
		toggleRepoInProject,
		getProjectsForRepo,
		isRepoInProject,
	};
}
