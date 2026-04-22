import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGhCliSetup } from "@/hooks/useGhCliSetup";
import { CheckCircle, XCircle, Download, LogIn } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/setup")({
	component: SetupPage,
});

function SetupPage() {
	const { isInstalled, isAuthenticated, isLoading } = useGhCliSetup();
	const navigate = useNavigate();

	useEffect(() => {
		// Si ya está configurado, redirigir al home
		if (isInstalled && isAuthenticated && !isLoading) {
			navigate({ to: "/" });
		}
	}, [isInstalled, isAuthenticated, isLoading, navigate]);

	return (
		<div className="max-w-2xl mx-auto py-12 px-4">
			<h1 className="text-3xl font-bold mb-2">Configuración de GitHub CLI</h1>
			<p className="text-muted-foreground mb-8">
				Para usar ReleaseHub, necesitas tener GitHub CLI instalado y configurado.
			</p>

			<div className="space-y-6">
				{/* Step 1: Install */}
				<div className="border rounded-lg p-6">
					<div className="flex items-start gap-4">
						<div className="flex-shrink-0">
							{isInstalled ? (
								<CheckCircle className="w-6 h-6 text-green-500" />
							) : (
								<XCircle className="w-6 h-6 text-red-500" />
							)}
						</div>
						<div className="flex-1">
							<h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
								<Download className="w-5 h-5" />
								1. Instalar GitHub CLI
							</h2>
							<p className="text-sm text-muted-foreground mb-3">
								GitHub CLI (gh) es necesario para interactuar con los repositorios.
							</p>
							<div className="bg-muted p-4 rounded-md text-sm font-mono space-y-2">
								<p className="text-muted-foreground"># macOS (Homebrew):</p>
								<p>brew install gh</p>
								<p className="text-muted-foreground mt-3"># Ubuntu/Debian:</p>
								<p>sudo apt install gh</p>
								<p className="text-muted-foreground mt-3"># Windows:</p>
								<p>winget install GitHub.cli</p>
							</div>
							{!isInstalled && (
								<p className="text-sm text-red-500 mt-3">
									GitHub CLI no está instalado. Instálalo y recarga la página.
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Step 2: Authenticate */}
				<div className="border rounded-lg p-6">
					<div className="flex items-start gap-4">
						<div className="flex-shrink-0">
							{isAuthenticated ? (
								<CheckCircle className="w-6 h-6 text-green-500" />
							) : (
								<XCircle className="w-6 h-6 text-red-500" />
							)}
						</div>
						<div className="flex-1">
							<h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
								<LogIn className="w-5 h-5" />
								2. Autenticar con GitHub
							</h2>
							<p className="text-sm text-muted-foreground mb-3">
								Autentícate con tu cuenta de GitHub para acceder a tus repositorios.
							</p>
							<div className="bg-muted p-4 rounded-md text-sm font-mono">
								<p>gh auth login</p>
							</div>
							{isInstalled && !isAuthenticated && (
								<p className="text-sm text-red-500 mt-3">
									GitHub CLI está instalado pero no autenticado. Ejecuta{" "}
									<code className="bg-muted px-1 rounded">gh auth login</code> y recarga la página.
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Refresh Button */}
				<div className="flex justify-center">
					<button
						onClick={() => window.location.reload()}
						className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Verificar nuevamente
					</button>
				</div>
			</div>

			{/* Success Message */}
			{isInstalled && isAuthenticated && (
				<div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
					<div className="flex items-center gap-2 text-green-700">
						<CheckCircle className="w-5 h-5" />
						<span className="font-medium">¡Configuración completa!</span>
					</div>
					<p className="text-sm text-green-600 mt-1">
						Redirigiendo al home...
					</p>
				</div>
			)}
		</div>
	);
}
