import { createFileRoute } from "@tanstack/react-router";
import { ProjectSelector } from "@/components/ProjectSelector";

export const Route = createFileRoute("/verification-page")({
	component: VerificationPage,
});

function VerificationPage() {
	return (
		<div className="container mx-auto p-20 flex flex-col items-center justify-center min-h-screen gap-10">
			<h1 className="text-2xl font-bold">Verificación de ProjectSelector</h1>

            <div className="p-10 border rounded-xl bg-card shadow-sm">
                <p className="text-sm text-muted-foreground mb-4">Selector con repo de prueba:</p>
				<ProjectSelector repo="galiprandi/release-hub" />
            </div>

            <div className="mt-20 text-center text-sm text-muted-foreground">
                <p>Instrucciones:</p>
                <ul className="list-disc list-inside">
                    <li>Haz clic en el botón para abrir el dropdown.</li>
                    <li>Verifica que la flecha rote.</li>
                    <li>Verifica que el dropdown aparezca con animación.</li>
                    <li>Presiona ESC para cerrar.</li>
                    <li>Haz clic fuera para cerrar.</li>
                </ul>
            </div>
		</div>
	);
}
