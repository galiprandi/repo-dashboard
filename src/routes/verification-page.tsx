import { createFileRoute } from "@tanstack/react-router";
import { PromoteDialog } from "@/components/PromoteDialog";
import { NovedadesDialog } from "@/components/NovedadesDialog";
import { ProjectSelector } from "@/components/ProjectSelector";

export const Route = createFileRoute("/verification-page")({
	component: VerificationPage,
});

function VerificationPage() {
	return (
		<div className="container mx-auto p-20 flex flex-col items-center justify-center min-h-screen gap-10">
			<h1 className="text-2xl font-bold">Panel de Verificación de UX (Croma)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                <section className="p-8 border rounded-xl bg-card shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold border-b pb-2">Refactorización de Diálogos (BaseDialog)</h2>
                    <div className="flex gap-4">
                        <PromoteDialog repo="galiprandi/release-hub" latestTag="v1.2.3" />
                        <NovedadesDialog />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Pruebas:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Promocionar: Verificar ancho dinámico (max-w-xl -&gt; max-w-5xl).</li>
                            <li>Novedades: Verificar título visible y ancho max-w-4xl.</li>
                            <li>Ambos: Verificar cierre con ESC y Click-outside.</li>
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
		</div>
	);
}
