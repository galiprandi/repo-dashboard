import { useState, useEffect } from "react";
import { Settings, Trash2, Save, AlertTriangle } from "lucide-react";
import { useUserCollections, type Project } from "@/hooks/useUserCollections";
import { BaseDialog } from "@/components/ui/BaseDialog";

interface ProjectSettingsDialogProps {
	project: Project;
	trigger?: React.ReactNode;
}

export function ProjectSettingsDialog({ project, trigger }: ProjectSettingsDialogProps) {
	const { updateProject, deleteProject } = useUserCollections();
	const [isOpen, setIsOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(project.description);

	useEffect(() => {
		if (isOpen) {
			setName(project.name);
			setDescription(project.description);
			setShowDeleteConfirm(false);
		}
	}, [isOpen, project]);

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		updateProject(project.id, {
			name: name.trim(),
			description: description.trim(),
		});
		setIsOpen(false);
	};

	const handleDelete = () => {
		deleteProject(project.id);
		setIsOpen(false);
	};

	return (
		<>
			{trigger ? (
				<div onClick={() => setIsOpen(true)} className="cursor-pointer">
					{trigger}
				</div>
			) : (
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1"
					aria-label="Configuración del proyecto"
					aria-haspopup="dialog"
				>
					<Settings className="w-4 h-4" />
				</button>
			)}

			<BaseDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				title={showDeleteConfirm ? "Eliminar proyecto" : "Configuración del proyecto"}
				description={
					showDeleteConfirm
						? "¿Estás seguro de que deseas eliminar este proyecto? Los repositorios no se eliminarán, solo se quitarán de esta colección."
						: "Edita el nombre y la descripción de tu proyecto."
				}
				maxWidth="max-w-md"
			>
				{showDeleteConfirm ? (
					<div className="space-y-6">
						<div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
							<AlertTriangle className="w-5 h-5 shrink-0" />
							<p className="text-sm font-medium">
								Esta acción es irreversible. Se perderá la organización de repositorios de este proyecto.
							</p>
						</div>
						<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleDelete}
								className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none focus-visible:ring-offset-1"
							>
								Eliminar proyecto
							</button>
						</div>
					</div>
				) : (
					<form onSubmit={handleSave} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="edit-project-name" className="text-sm font-medium">
								Nombre del proyecto
							</label>
							<input
								id="edit-project-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full px-3 py-2 text-sm border rounded-md bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 border-input"
								placeholder="Nombre del proyecto"
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="edit-project-desc" className="text-sm font-medium">
								Descripción
							</label>
							<textarea
								id="edit-project-desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="w-full px-3 py-2 text-sm border rounded-md bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 border-input min-h-[100px]"
								placeholder="Descripción breve del proyecto"
							/>
						</div>
						<div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(true)}
								className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none focus-visible:ring-offset-1"
							>
								<Trash2 className="w-4 h-4" />
								Eliminar proyecto
							</button>
							<div className="flex flex-col-reverse sm:flex-row gap-2">
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={!name.trim() || (name === project.name && description === project.description)}
									className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1"
								>
									<Save className="w-4 h-4" />
									Guardar cambios
								</button>
							</div>
						</div>
					</form>
				)}
			</BaseDialog>
		</>
	);
}
