import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGhCliSetup } from "@/hooks/useGhCliSetup";
import { useJqSetup } from "@/hooks/useJqSetup";
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Clipboard, ClipboardCheck, Download, LogIn, Terminal } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";

export const Route = createFileRoute("/setup")({
	component: SetupPage,
});

function detectOS(): "macOS" | "Linux" | "Windows" | "unknown" {
	const userAgent = navigator.userAgent.toLowerCase();
	const platform = navigator.platform.toLowerCase();

	if (platform.includes("mac") || userAgent.includes("mac")) {
		return "macOS";
	}
	if (platform.includes("win") || userAgent.includes("win")) {
		return "Windows";
	}
	if (platform.includes("linux") || userAgent.includes("linux")) {
		return "Linux";
	}
	return "unknown";
}

function SetupPage() {
	const { isInstalled: ghInstalled, isAuthenticated, isLoading: ghLoading } = useGhCliSetup();
	const { isInstalled: jqInstalled, isLoading: jqLoading } = useJqSetup();
	const navigate = useNavigate();

	const detectedOS = detectOS();
	const isLoading = ghLoading || jqLoading;
	const allInstalled = ghInstalled && jqInstalled;

	useEffect(() => {
		if (allInstalled && isAuthenticated && !isLoading) {
			navigate({ to: "/" });
		}
	}, [allInstalled, isAuthenticated, isLoading, navigate]);

	const allOk = ghInstalled && jqInstalled && isAuthenticated;

	return (
		<div className="max-w-2xl mx-auto py-12 px-4">
			<h1 className="text-3xl font-bold mb-2">Configuración del entorno</h1>
			<p className="text-muted-foreground mb-8">
				El uso de ReleaseHub requiere la instalación y configuración previa de GitHub CLI y jq.
			</p>

			<div className="space-y-3">
				{/* Verified deps — compact list with description */}
				{ghInstalled && (
					<div className="flex items-start gap-2 text-green-600 text-sm">
						<CheckCircle className="w-4 h-4 mt-0.5" />
						<div>
							<p className="font-medium">GitHub CLI</p>
							<p className="text-muted-foreground text-xs">Interfaz oficial de GitHub para listar repos, crear tags y consultar commits.</p>
						</div>
					</div>
				)}
				{jqInstalled && (
					<div className="flex items-start gap-2 text-green-600 text-sm">
						<CheckCircle className="w-4 h-4 mt-0.5" />
						<div>
							<p className="font-medium">jq</p>
							<p className="text-muted-foreground text-xs">Procesa y filtra las respuestas JSON de la API de GitHub.</p>
						</div>
					</div>
				)}
				{isAuthenticated && (
					<div className="flex items-start gap-2 text-green-600 text-sm">
						<CheckCircle className="w-4 h-4 mt-0.5" />
						<div>
							<p className="font-medium">Autenticación con GitHub</p>
							<p className="text-muted-foreground text-xs">Permite a ReleaseHub acceder a tus repositorios y organizaciones.</p>
						</div>
					</div>
				)}

				{/* Missing deps — expanded cards */}
				{!ghInstalled && (
					<MissingCard
						icon={<Download className="w-5 h-5" />}
						title="GitHub CLI"
						description="Interfaz de línea de comandos oficial de GitHub. Se usa para listar repositorios, crear tags y obtener información de commits directamente desde la API de GitHub sin necesidad de clonar los repos."
						commands={[
							{ label: "macOS (Homebrew)", cmd: "brew install gh", os: "macOS" },
							{ label: "Ubuntu/Debian", cmd: "sudo apt install gh", os: "Linux" },
							{ label: "Windows", cmd: "winget install GitHub.cli", os: "Windows" },
						]}
						detectedOS={detectedOS}
					/>
				)}
				{!jqInstalled && (
					<MissingCard
						icon={<Terminal className="w-5 h-5" />}
						title="jq"
						description="Procesador de JSON liviano de línea de comandos. ReleaseHub lo utiliza para filtrar y transformar las respuestas de la API de GitHub antes de mostrarlas en la interfaz."
						commands={[
							{ label: "macOS (Homebrew)", cmd: "brew install jq", os: "macOS" },
							{ label: "Ubuntu/Debian", cmd: "sudo apt install jq", os: "Linux" },
							{ label: "Windows", cmd: "winget install jqlang.jq", os: "Windows" },
						]}
						detectedOS={detectedOS}
					/>
				)}
				{ghInstalled && !isAuthenticated && (
					<MissingCard
						icon={<LogIn className="w-5 h-5" />}
						title="Autenticación con GitHub"
						description="Autentica tu cuenta de GitHub en la CLI para que ReleaseHub pueda acceder a tus repositorios y organizaciones. Este paso abre un flujo OAuth en tu navegador."
						commands={[{ label: "", cmd: "gh auth login", os: null }]}
						detectedOS={detectedOS}
					/>
				)}
			</div>

			{/* Refresh Button */}
			<div className="flex justify-center mt-8">
				<button
					onClick={() => window.location.reload()}
					className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					Verificar configuración
				</button>
			</div>

			{/* Success Message */}
			{allOk && (
				<div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
					<div className="flex items-center gap-2 text-green-700">
						<CheckCircle className="w-5 h-5" />
						<span className="font-medium">Configuración completada con éxito</span>
					</div>
					<p className="text-sm text-green-600 mt-1">
						Redirección a la página principal...
					</p>
				</div>
			)}
		</div>
	);
}

function MissingCard({
	icon,
	title,
	description,
	commands,
	detectedOS,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	commands: Array<{ label: string; cmd: string; os: "macOS" | "Linux" | "Windows" | null }>;
	detectedOS: "macOS" | "Linux" | "Windows" | "unknown";
}) {
	const [open, setOpen] = useState(true);

	// Filter commands based on detected OS
	const filteredCommands = useMemo(() => {
		if (detectedOS === "unknown") {
			return commands;
		}
		return commands.filter((c) => c.os === detectedOS || c.os === null);
	}, [commands, detectedOS]);

	return (
		<div className="border border-red-200 rounded-lg p-4 bg-red-50/50">
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex items-center gap-3 text-left"
			>
				<XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
				<div className="flex-1">
					<h2 className="font-semibold flex items-center gap-2">
						{icon}
						{title}
					</h2>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
				{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
			</button>
			{open && (
				<div className="mt-3 bg-muted p-4 rounded-md text-sm font-mono space-y-3">
					{filteredCommands.map((c: { label: string; cmd: string; os: "macOS" | "Linux" | "Windows" | null }) => (
						<div key={c.cmd}>
							{c.label && <p className="text-muted-foreground"># {c.label}</p>}
							<div className="flex items-center justify-between gap-2 group">
								<p className="flex-1">{c.cmd}</p>
								<CopyButton text={c.cmd} />
							</div>
						</div>
					))}
					{detectedOS !== "unknown" && (
						<p className="text-xs text-muted-foreground mt-2">
							Comandos para {detectedOS} detectados.{" "}
							<button
								onClick={() => setOpen(true)}
								className="underline hover:text-foreground"
							>
								Ver todas las opciones
							</button>
						</p>
					)}
				</div>
			)}
		</div>
	);
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback: silently ignore if clipboard is unavailable
		}
	}, [text]);

	return (
		<button
			onClick={handleCopy}
			title="Copiar al portapapeles"
			className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted-foreground/20"
		>
			{copied ? (
				<ClipboardCheck className="w-4 h-4 text-green-600" />
			) : (
				<Clipboard className="w-4 h-4 text-muted-foreground" />
			)}
		</button>
	);
}
