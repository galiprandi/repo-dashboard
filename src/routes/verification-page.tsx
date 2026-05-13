import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PromoteDialog } from "@/components/PromoteDialog";
import { NovedadesDialog } from "@/components/NovedadesDialog";
import { ProjectSelector } from "@/components/ProjectSelector";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { CommitsModal } from "@/components/CommitsModal";

export const Route = createFileRoute("/verification-page")({
	component: VerificationPage,
});

function VerificationPage() {
	const [isCommitsModalOpen, setIsCommitsModalOpen] = useState(false);
	const mockCommits = [
		{
			hash: "hash1",
			shortHash: "h1",
			subject: "Feature: Add support for BaseDialog",
			body: "Implement BaseDialog to standardize modal behavior across the app.",
			message: "Feature: Add support for BaseDialog\n\nImplement BaseDialog to standardize modal behavior across the app.",
			author: "Jules Agent",
			date: "2024-05-20",
		},
		{
			hash: "hash2",
			shortHash: "h2",
			subject: "Fix: Memory leak in useAISummarize",
			body: "Fixes a memory leak where the AI summarizer would not clean up properly.",
			message: "Fix: Memory leak in useAISummarize\n\nFixes a memory leak where the AI summarizer would not clean up properly.",
			author: "Jules Agent",
			date: "2024-05-19",
		},
		{
			hash: "hash3",
			shortHash: "h3",
			subject: "Docs: Update AGENTS.md",
			body: "Added new instructions for frontend verification.",
			message: "Docs: Update AGENTS.md\n\nAdded new instructions for frontend verification.",
			author: "Jules Agent",
			date: "2024-05-18",
		}
	];
	return (
		<div className="container mx-auto p-20 flex flex-col items-center justify-center min-h-screen gap-10">
			<h1 className="text-2xl font-bold">Panel de Verificación de UX (Croma)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                <section className="p-8 border rounded-xl bg-card shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold border-b pb-2">Refactorización de Diálogos (BaseDialog)</h2>
                    <div className="flex gap-4 flex-wrap">
                        <PromoteDialog repo="galiprandi/release-hub" latestTag="v1.2.3" />
                        <NovedadesDialog />
                        <FeedbackDialog />
                        <button
                            type="button"
                            onClick={() => setIsCommitsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
                        >
                            Ver Commits (Modal)
                        </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Pruebas:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Promocionar: Verificar ancho dinámico (max-w-xl -&gt; max-w-5xl).</li>
                            <li>Novedades: Verificar título visible y ancho max-w-4xl.</li>
                            <li>Feedback: Verificar stepper, focus rings en inputs y ancho dinámico.</li>
                            <li>CommitsModal: Verificar lista de commits, filtrado y expansión.</li>
                            <li>Todos: Verificar cierre con ESC y Click-outside (BaseDialog).</li>
                        </ul>
                    </div>
                    <CommitsModal
                        isOpen={isCommitsModalOpen}
                        onClose={() => setIsCommitsModalOpen(false)}
                        commits={mockCommits}
                        prodCommitHash="hash-none"
                        prodTag="v1.2.2"
                    />
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
		</div>
	);
}
