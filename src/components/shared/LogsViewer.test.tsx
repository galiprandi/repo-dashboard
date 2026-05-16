import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogsViewer } from "./LogsViewer";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

// Mock the hooks
vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useQuery: vi.fn(),
		useQueryClient: vi.fn(() => ({
			getQueryData: vi.fn(),
			fetchQuery: vi.fn(),
			removeQueries: vi.fn(),
		})),
	};
});

vi.mock("@galiprandi/react-tools", () => ({
	LazyRender: ({ children }: { children: React.ReactNode }) => <div data-testid="lazy-render">{children}</div>,
	useAISummarize: vi.fn(() => ({
		data: "",
		status: "idle",
		error: null,
		summarize: vi.fn(),
		reset: vi.fn(),
	})),
}));

vi.mock("@/hooks/useAIErrorProcessor", () => ({
	useAIErrorProcessor: vi.fn(() => ({
		processError: vi.fn(),
	})),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe("LogsViewer", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		vi.clearAllMocks();
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
	});

	const renderComponent = (props = {}) => {
		const defaultProps = {
			queryFn: vi.fn().mockResolvedValue("2026-05-20 log line 1\n2026-05-20 log line 2"),
			onClose: vi.fn(),
			asModal: false,
			...props,
		};

		return render(
			<QueryClientProvider client={queryClient}>
				<LogsViewer {...defaultProps} />
			</QueryClientProvider>
		);
	};

	it("should render logs when data is loaded", async () => {
		vi.mocked(useQuery).mockReturnValue({
			data: "2026-05-20 log line 1\n2026-05-20 log line 2",
			isLoading: false,
			error: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		renderComponent();

		expect(await screen.findByText(/log line 1/)).toBeInTheDocument();
		expect(await screen.findByText(/log line 2/)).toBeInTheDocument();
	});

	it("should show loading state", () => {
		vi.mocked(useQuery).mockReturnValue({
			data: null,
			isLoading: true,
			error: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		renderComponent();

		expect(screen.getByText("Cargando logs...")).toBeInTheDocument();
	});

	it("should filter logs by text", async () => {
		vi.mocked(useQuery).mockReturnValue({
			data: "2026-05-20 apple\n2026-05-20 banana\n2026-05-20 cherry",
			isLoading: false,
			error: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		renderComponent();

		const searchInput = screen.getByLabelText("Buscar logs");

		await act(async () => {
			fireEvent.change(searchInput, { target: { value: "apple" } });
		});

		expect(await screen.findByText(/apple/)).toBeInTheDocument();
		expect(screen.queryByText(/banana/)).not.toBeInTheDocument();
		expect(screen.queryByText(/cherry/)).not.toBeInTheDocument();
	});

	it("should filter logs by level", async () => {
		vi.mocked(useQuery).mockReturnValue({
			data: "2026-05-20 ERROR: message 2\n2026-05-20 INFO: message 1",
			isLoading: false,
			error: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		renderComponent();

		const levelSelect = screen.getByLabelText("Filtrar por nivel de log");

		await act(async () => {
			fireEvent.change(levelSelect, { target: { value: "ERROR" } });
		});

		const logs = screen.getAllByTestId("lazy-render");
		expect(logs.some(l => l.textContent?.includes("ERROR"))).toBe(true);
		expect(logs.every(l => !l.textContent?.includes("INFO"))).toBe(true);
	});

	it("should call onResourceChange when resource is selected", async () => {
		vi.mocked(useQuery).mockReturnValue({
			data: "2026-05-20 logs",
			isLoading: false,
			error: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const onResourceChange = vi.fn();
		const resources = [
			{ id: "1", name: "Resource 1", type: "pod" },
			{ id: "2", name: "Resource 2", type: "pod" },
		];

		renderComponent({ resources, selectedResourceId: "1", onResourceChange });

		const resourceSelect = screen.getByLabelText("Seleccionar recurso");

		await act(async () => {
			fireEvent.change(resourceSelect, { target: { value: "2" } });
		});

		expect(onResourceChange).toHaveBeenCalledWith("2");
	});

	it("should render as a modal when asModal is true", async () => {
		vi.mocked(useQuery).mockReturnValue({
			data: "2026-05-20 logs",
			isLoading: false,
			error: null,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		renderComponent({ asModal: true });

		expect(await screen.findByText("Visor de Logs")).toBeInTheDocument();
	});
});
