from playwright.sync_api import sync_playwright, expect
import time

def verify_project_selector():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            # Navigate to the dedicated verification page
            print("Navigating to http://localhost:5173/verification-page")
            page.goto("http://localhost:5173/verification-page")

            # Print page content for debugging
            # print(page.content())
            page.screenshot(path="verification/initial_load.png")

            # Wait for any button
            page.wait_for_selector("button")

            # Wait for the button to be visible
            button = page.get_by_role("button", name="Asignar a proyecto")
            expect(button).to_be_visible(timeout=10000)

            # Take a screenshot before opening
            page.screenshot(path="verification/project_selector_closed.png")
            print("Captured: verification/project_selector_closed.png")

            # Click to open
            button.click()

            # Wait for the dropdown to be visible
            dropdown = page.get_by_role("listbox")
            expect(dropdown).to_be_visible()

            # Take a screenshot while open
            page.screenshot(path="verification/project_selector_open.png")
            print("Captured: verification/project_selector_open.png")

            # Press Escape to verify it closes
            page.keyboard.press("Escape")
            # Give a small time for animation
            time.sleep(0.5)
            expect(dropdown).not_to_be_visible()
            print("Escape key verification successful")

            # Open again
            button.click()
            expect(dropdown).to_be_visible()

            # Click outside to verify it closes
            # Clicking at the top-left of the page
            page.mouse.click(10, 10)
            time.sleep(0.5)
            expect(dropdown).not_to_be_visible()
            print("Click outside verification successful")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_project_selector()
