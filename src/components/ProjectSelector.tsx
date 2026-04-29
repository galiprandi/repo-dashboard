import { useState } from "react";
import { FolderPlus, FolderOpen, X, Check, ChevronDown, Plus } from "lucide-react";
import { useUserCollections } from "@/hooks/useUserCollections";

interface ProjectSelectorProps {
	repo: string;
}

export function ProjectSelector({ repo }: ProjectSelectorProps) {
	const { projects, createProject, addRepoToProject, removeRepoFromProject, isRepoInProject, getProjectsForRepo } = useUserCollections();
	const [isOpen, setIsOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDesc, setNewDesc] = useState("");

	const repoProjects = getProjectsForRepo(repo);
	const hasProjects = repoProjects.length > 0;

	function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!newName.trim()) return;
		createProject(newName.trim(), newDesc.trim() || "", [repo]);
		setNewName("");
		setNewDesc("");
		setIsCreating(false);
	}

	return (
		<div className="relative">
			<button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
				{hasProjects ? <><FolderOpen className="w-4 h-4 text-primary" /><span>{repoProjects.length === 1 ? repoProjects[0].name : `${repoProjects.length} proyectos`}</span></> : <><FolderPlus className="w-4 h-4" /><span>Agregar a proyecto</span></>}
				<ChevronDown className="w-3 h-3" />
			</button>
			{isOpen && (
				<div className="absolute top-full left-0 mt-1 w-72 bg-white border rounded-lg shadow-lg z-50 py-1">
					{projects.length === 0 && !isCreating && <div className="px-3 py-2 text-sm text-muted-foreground">Sin proyectos. Crea el primero.</div>}
					{projects.map(p => {
						const inP = isRepoInProject(p.id, repo);
						return <button key={p.id} type="button" onClick={() => { void (inP ? removeRepoFromProject(p.id, repo) : addRepoToProject(p.id, repo)); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
							{inP ? <Check className="w-4 h-4 text-primary" /> : <div className="w-4 h-4" />}
							<div className="flex-1 min-w-0">
								<div className="font-medium truncate">{p.name}</div>
								{p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
							</div>
							{inP && <X className="w-3 h-3 text-muted-foreground" />}
						</button>;
					})}
					<div className="border-t mt-1 pt-1">
						{isCreating ? (
							<form onSubmit={handleCreate} className="px-3 py-2 space-y-2">
								<input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre del proyecto" className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
								<input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción (opcional)" className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary" />
								<div className="flex gap-2">
									<button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded">Cancelar</button>
									<button type="submit" disabled={!newName.trim()} className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50">Crear</button>
								</div>
							</form>
							) : (
								<button type="button" onClick={() => setIsCreating(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left text-primary">
									<Plus className="w-4 h-4" /> Nuevo proyecto
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		);
	}
