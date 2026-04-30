import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Loader2, Search, RefreshCw, X, ClipboardCopy, Check } from "lucide-react";
import { useKubectlNamespaceAccess } from "@/hooks/useKubectlNamespaceAccess";
import { getPods, getDeployments, getResourceLogs, type PodInfo, type DeploymentInfo } from "@/api/kubectl";

interface K8sSectionProps {
	namespace: string;
}

export function K8sSection({ namespace }: K8sSectionProps) {
	const { data: access, isLoading: checkingAccess } = useKubectlNamespaceAccess(namespace);
	const [activeType, setActiveType] = useState<"deployments" | "pods">("deployments");
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
	const [logTailSize, setLogTailSize] = useState<number>(100);

	if (checkingAccess) {
		return (
			<div className="border rounded-lg p-4 flex items-center justify-center gap-2 text-muted-foreground">
				<Loader2 className="w-4 h-4 animate-spin" />
				<span>Verificando acceso a Kubernetes...</span>
			</div>
		);
	}

	if (!access?.hasAccess) {
		return null;
	}

	return (
		<>
			<div className="border rounded-lg p-3 flex items-center gap-3 bg-muted/30">
				<Boxes className="w-5 h-5 text-blue-600 flex-shrink-0" />
				
				{access.canGetDeployments && access.canGetPods && (
					<div className="flex gap-1">
						<button
							type="button"
							onClick={() => setActiveType("deployments")}
							className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
								activeType === "deployments"
									? "bg-background text-foreground border"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Deployments
						</button>
						<button
							type="button"
							onClick={() => setActiveType("pods")}
							className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
								activeType === "pods"
									? "bg-background text-foreground border"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Pods
						</button>
					</div>
				)}

				<ResourceDropdown
					namespace={namespace}
					type={activeType}
					selectedItem={selectedItem}
					onSelect={setSelectedItem}
					enabled={activeType === "deployments" ? access.canGetDeployments : access.canGetPods}
				/>

				{selectedItem && <ResourceStats namespace={namespace} type={activeType} name={selectedItem} />}

				<div className="flex-1" />

				{selectedItem && access.canGetPodLogs && (
					<button
						type="button"
						onClick={() => setIsLogsModalOpen(true)}
						className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
					>
						<Search className="w-3.5 h-3.5" />
						Logs
					</button>
				)}
			</div>

			{isLogsModalOpen && selectedItem && (
				<LogsModal
					namespace={namespace}
					type={activeType}
					name={selectedItem}
					tailSize={logTailSize}
					onTailSizeChange={setLogTailSize}
					onClose={() => setIsLogsModalOpen(false)}
				/>
			)}
		</>
	);
}

function ResourceDropdown({
	namespace,
	type,
	selectedItem,
	onSelect,
	enabled,
}: {
	namespace: string;
	type: "deployments" | "pods";
	selectedItem: string | null;
	onSelect: (item: string | null) => void;
	enabled: boolean;
}) {
	const { data: items, isLoading } = useQuery({
		queryKey: ["kubectl", type, namespace],
		queryFn: async () => {
			if (type === "deployments") {
				return await getDeployments(namespace);
			}
			return await getPods(namespace);
		},
		enabled,
		refetchInterval: 30000,
	});

	if (!enabled) return null;

	return (
		<div className="relative">
			<select
				value={selectedItem || ""}
				onChange={(e) => onSelect(e.target.value || null)}
				disabled={isLoading || !items || items.length === 0}
				className="min-w-[200px] px-2 py-1 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
			>
				<option value="">Seleccionar {type === "deployments" ? "deployment" : "pod"}</option>
				{items?.map((item) => (
					<option key={item.name} value={item.name}>
						{item.name}
					</option>
				))}
			</select>
		</div>
	);
}

function ResourceStats({ namespace, type, name }: { namespace: string; type: "deployments" | "pods"; name: string }) {
	const { data: item, isLoading } = useQuery({
		queryKey: ["kubectl", type, namespace, name],
		queryFn: async () => {
			const items = type === "deployments" ? await getDeployments(namespace) : await getPods(namespace);
			return items?.find((i) => i.name === name);
		},
		enabled: !!name,
		refetchInterval: 30000,
	});

	if (isLoading || !item) {
		return <div className="text-xs text-muted-foreground">Cargando...</div>;
	}

	if (type === "deployments") {
		const deployment = item as DeploymentInfo;
		return (
			<div className="flex items-center gap-3 text-xs">
				<span className="text-muted-foreground">Ready: {deployment.ready}</span>
				<span className="text-muted-foreground">Up-to-date: {deployment.upToDate}</span>
				<span className="text-muted-foreground">Available: {deployment.available}</span>
				<span className="text-muted-foreground">Age: {deployment.age}</span>
			</div>
		);
	}

	const pod = item as PodInfo;
	return (
		<div className="flex items-center gap-3 text-xs">
			<span className="text-muted-foreground">Ready: {pod.ready}</span>
			<span
				className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
					pod.status === "Running"
						? "bg-green-100 text-green-700"
						: pod.status === "Completed"
							? "bg-blue-100 text-blue-700"
							: pod.status === "Error"
								? "bg-red-100 text-red-700"
								: "bg-gray-100 text-gray-700"
				}`}
			>
				{pod.status}
			</span>
			<span className="text-muted-foreground">Restarts: {pod.restarts}</span>
			<span className="text-muted-foreground">Age: {pod.age}</span>
		</div>
	);
}

function LogsModal({
	namespace,
	type,
	name,
	tailSize,
	onTailSizeChange,
	onClose,
}: {
	namespace: string;
	type: "deployments" | "pods";
	name: string;
	tailSize: number;
	onTailSizeChange: (size: number) => void;
	onClose: () => void;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [copied, setCopied] = useState(false);
	const resourceType = type === "deployments" ? "deployment" : "pod";
	const { data: logs, isLoading, refetch } = useQuery({
		queryKey: ["kubectl", "logs", resourceType, namespace, name, tailSize],
		queryFn: () => getResourceLogs(resourceType, name, namespace, tailSize),
		enabled: !!namespace && !!name,
	});

	const filteredLines = logs
		? logs.split("\n").filter((line) => searchQuery === "" || line.toLowerCase().includes(searchQuery.toLowerCase()))
		: [];

	const handleCopy = async () => {
		if (!logs) return;
		await navigator.clipboard.writeText(logs);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
				<div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold">Logs: {name}</h3>
						<span className="text-xs text-muted-foreground">({type})</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Filtrar logs..."
								className="pl-7 pr-2 py-1 text-sm bg-background border rounded-md w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<select
							value={tailSize}
							onChange={(e) => onTailSizeChange(Number(e.target.value))}
							className="bg-background border rounded px-2 py-1 text-sm"
						>
							<option value={50}>50 líneas</option>
							<option value={100}>100 líneas</option>
							<option value={500}>500 líneas</option>
							<option value={1000}>1000 líneas</option>
						</select>
						<button
							type="button"
							onClick={() => refetch()}
							className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
							title="Recargar"
						>
							<RefreshCw className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={handleCopy}
							className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
							title={copied ? "Copiado!" : "Copiar logs"}
						>
							{copied ? <Check className="w-4 h-4 text-green-500" /> : <ClipboardCopy className="w-4 h-4" />}
						</button>
						<button
							type="button"
							onClick={onClose}
							className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
							title="Cerrar"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
				<div className="flex-1 overflow-auto bg-black text-green-400 p-4 font-mono text-xs">
					{isLoading ? (
						<div className="flex items-center justify-center gap-2 h-full text-gray-400">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Cargando logs...</span>
						</div>
					) : (
						<pre className="whitespace-pre-wrap break-words">{filteredLines.length > 0 ? filteredLines.join("\n") : (logs || "No logs disponibles")}</pre>
					)}
				</div>
			</div>
		</div>
	);
}

