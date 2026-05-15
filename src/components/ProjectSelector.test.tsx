import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ProjectSelector } from "./ProjectSelector"
import { useUserCollections } from "@/hooks/useUserCollections"

// Mock hooks
const mockCreateProject = vi.fn()
const mockAddRepoToProject = vi.fn()
const mockRemoveRepoFromProject = vi.fn()
const mockIsRepoInProject = vi.fn().mockReturnValue(false)
const mockGetProjectsForRepo = vi.fn().mockReturnValue([])

vi.mock("@/hooks/useUserCollections", () => ({
	useUserCollections: vi.fn(() => ({
		projects: [],
		createProject: mockCreateProject,
		addRepoToProject: mockAddRepoToProject,
		removeRepoFromProject: mockRemoveRepoFromProject,
		isRepoInProject: mockIsRepoInProject,
		getProjectsForRepo: mockGetProjectsForRepo,
	})),
}))

interface BaseDialogMockProps {
	children: React.ReactNode
	open: boolean
	title: React.ReactNode
}

// Mock BaseDialog to avoid Radix UI issues in tests
vi.mock("@/components/ui/BaseDialog", () => ({
	BaseDialog: ({ children, open, title }: BaseDialogMockProps) =>
		open ? (
			<div data-testid="base-dialog">
				<h1>{title}</h1>
				{children}
			</div>
		) : null
}))

describe("ProjectSelector", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(useUserCollections).mockReturnValue({
			projects: [],
			createProject: mockCreateProject,
			addRepoToProject: mockAddRepoToProject,
			removeRepoFromProject: mockRemoveRepoFromProject,
			isRepoInProject: mockIsRepoInProject,
			getProjectsForRepo: mockGetProjectsForRepo,
		})
	})

	it("should render trigger button", () => {
		render(<ProjectSelector repo="test-repo" />)
		expect(screen.getByRole("button", { name: /asignar a proyecto/i })).toBeInTheDocument()
		expect(screen.getByText(/agregar a proyecto/i)).toBeInTheDocument()
	})

	it("should open projects list when clicked", () => {
		render(<ProjectSelector repo="test-repo" />)
		const trigger = screen.getByRole("button", { name: /asignar a proyecto/i })
		fireEvent.click(trigger)
		expect(screen.getByRole("listbox")).toBeInTheDocument()
		expect(screen.getByText(/sin proyectos/i)).toBeInTheDocument()
	})

	it("should render projects when they exist", () => {
		const mockProjects = [
			{ id: "1", name: "Project 1", description: "Desc 1" },
			{ id: "2", name: "Project 2", description: "Desc 2" }
		]
		vi.mocked(useUserCollections).mockReturnValue({
			projects: mockProjects,
			createProject: mockCreateProject,
			addRepoToProject: mockAddRepoToProject,
			removeRepoFromProject: mockRemoveRepoFromProject,
			isRepoInProject: mockIsRepoInProject,
			getProjectsForRepo: mockGetProjectsForRepo,
		})

		render(<ProjectSelector repo="test-repo" />)
		fireEvent.click(screen.getByRole("button", { name: /asignar a proyecto/i }))

		expect(screen.getByText("Project 1")).toBeInTheDocument()
		expect(screen.getByText("Project 2")).toBeInTheDocument()
	})

	it("should open create project dialog", () => {
		render(<ProjectSelector repo="test-repo" />)
		fireEvent.click(screen.getByRole("button", { name: /asignar a proyecto/i }))

		const newProjectButton = screen.getByRole("button", { name: /nuevo proyecto/i })
		fireEvent.click(newProjectButton)

		expect(screen.getByTestId("base-dialog")).toBeInTheDocument()
		expect(screen.getByText("Crear nuevo proyecto")).toBeInTheDocument()
		expect(screen.getByLabelText(/nombre del proyecto/i)).toBeInTheDocument()
	})

	it("should call createProject when form is submitted", () => {
		render(<ProjectSelector repo="test-repo" />)
		fireEvent.click(screen.getByRole("button", { name: /asignar a proyecto/i }))
		fireEvent.click(screen.getByRole("button", { name: /nuevo proyecto/i }))

		const nameInput = screen.getByLabelText(/nombre del proyecto/i)
		const descInput = screen.getByLabelText(/descripción \(opcional\)/i)

		fireEvent.change(nameInput, { target: { value: "New Project" } })
		fireEvent.change(descInput, { target: { value: "A new description" } })

		fireEvent.submit(screen.getByRole("button", { name: /crear proyecto/i }))

		expect(mockCreateProject).toHaveBeenCalledWith("New Project", "A new description", ["test-repo"])
	})
})
