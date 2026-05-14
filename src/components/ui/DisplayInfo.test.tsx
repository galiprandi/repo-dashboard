import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisplayInfo } from "./DisplayInfo";

// Mock DayJS to have consistent results
vi.mock("@/lib/dayjs", () => {
	return {
		default: () => ({
			fromNow: () => "hace 2 días",
			utc: () => ({
				format: () => "2024-05-18 10:00:00",
			}),
			local: () => ({
				format: () => "2024-05-18 12:00:00",
			}),
		}),
	};
});

describe("DisplayInfo", () => {
	it("renders '-' when value is missing", () => {
		render(<DisplayInfo type="commit" value={null} />);
		expect(screen.getByText("-")).toBeDefined();
	});

	it("renders commit type with correct icon and text", () => {
		const { container } = render(<DisplayInfo type="commit" value="abcdef" />);
		expect(screen.getByText("abcdef")).toBeDefined();
		expect(container.querySelector(".text-blue-500")).not.toBeNull();
	});

	it("renders dates type using fromNow", () => {
		render(<DisplayInfo type="dates" value="2024-05-18T10:00:00Z" />);
		expect(screen.getByText("hace 2 días")).toBeDefined();
	});

	it("truncates message type when maxChar is provided", () => {
		render(<DisplayInfo type="message" value="This is a very long message" maxChar={10} />);
		expect(screen.getByText("This is a ...")).toBeDefined();
	});

	it("adds tooltip for dates type", () => {
		render(<DisplayInfo type="dates" value="2024-05-18T10:00:00Z" />);
		const element = screen.getByText("hace 2 días");
		expect(element.getAttribute("title")).toContain("2024-05-18 10:00:00");
		expect(element.getAttribute("tabIndex")).toBe("0");
	});

	it("adds tooltip for long message", () => {
		const longMessage = "This is a message that is longer than fifty characters to trigger the tooltip.";
		render(<DisplayInfo type="message" value={longMessage} maxChar={10} />);
		const element = screen.getByText("This is a ...");
		expect(element.getAttribute("title")).toBe(longMessage);
	});
});
