import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PromoteDialog } from "@/components/PromoteDialog";
import { NovedadesDialog } from "@/components/NovedadesDialog";
import { ProjectSelector } from "@/components/ProjectSelector";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { CommitsModal } from "@/components/CommitsModal";
import { GitCommit } from "lucide-react";

export const Route = createFileRoute("/verification-page")({
	component: VerificationPage,
});

const MOCK_COMMITS = [
    {
        hash: "a1b2c3d4e5f6g7h8i9j0",
        shortHash: "a1b2c3d",
        subject: "feat: implementar autenticación biométrica",
        body: "Se ha añadido soporte para FaceID y TouchID en dispositivos compatibles.\n\n- Actualización de dependencias de seguridad\n- Nueva interfaz de configuración",
        message: "feat: implementar autenticación biométrica",
        author: "Juan Pérez",
        date: "2024-05-10"
    },
    {
        hash: "b2c3d4e5f6g7h8i9j0a1",
        shortHash: "b2c3d4e",
        subject: "fix: corregir error de desbordamiento en tablas",
        body: "Las tablas con muchas columnas se salían del contenedor en pantallas pequeñas.\nSe aplicó overflow-x: auto.",
        message: "fix: corregir error de desbordamiento en tablas",
        author: "María García",
        date: "2024-05-09"
    },
    {
        hash: "c3d4e5f6g7h8i9j0a1b2",
        shortHash: "c3d4e5f",
        subject: "chore: actualizar dependencias de desarrollo",
        body: "",
        message: "chore: actualizar dependencias de desarrollo",
        author: "Alex Root",
        date: "2024-05-08"
    }
];

function VerificationPage() {
    const [isCommitsModalOpen, setIsCommitsModalOpen] = useState(false);

	return (
		<div className="container mx-auto p-20 flex flex-col items-center justify-center min-h-screen gap-10">
			<h1 className="text-2xl font-bold">Panel de Verificación de UX (Croma)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                <section className="p-8 border rounded-xl bg-card shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold border-b pb-2">Refactorización de Diálogos (BaseDialog)</h2>
                    <div className="flex flex-wrap gap-4">
                        <PromoteDialog repo="galiprandi/release-hub" latestTag="v1.2.3" />
                        <NovedadesDialog />
                        <FeedbackDialog />
                        <button
                            type="button"
                            onClick={() => setIsCommitsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                        >
                            <GitCommit className="w-4 h-4" />
                            Ver Commits
                        </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Pruebas:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Promocionar: Verificar ancho dinámico (max-w-xl -&gt; max-w-5xl).</li>
                            <li>Novedades: Verificar título visible y ancho max-w-4xl.</li>
                            <li>Feedback: Verificar stepper, focus rings en inputs y ancho dinámico.</li>
                            <li>Commits: Verificar refactor a BaseDialog (max-w-5xl) y a11y.</li>
                            <li>Todos: Verificar cierre con ESC y Click-outside (BaseDialog).</li>
                        </ul>
                    </div>
                </section>

                <section className="p-8 border rounded-xl bg-card shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold border-b pb-2">Selectores de Proyecto</h2>
                    <ProjectSelector repo="galiprandi/release-hub" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Pruebas:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Verificar rotación de flecha al abrir.</li>
                            <li>Verificar animación de entrada del dropdown.</li>
                            <li>Verificar navegación por teclado y ARIA roles.</li>
                        </ul>
                    </div>
                </section>
            </div>

            <CommitsModal
                open={isCommitsModalOpen}
                onOpenChange={setIsCommitsModalOpen}
                commits={MOCK_COMMITS}
                prodCommitHash="c3d4e5f6g7h8i9j0a1b2"
                prodTag="v1.2.2"
            />
		</div>
	);
}
