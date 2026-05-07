from playwright.sync_api import sync_playwright, expect
import time
import os

def verify_search_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # Navigate to the app
            page.goto("http://localhost:5173/")
            time.sleep(5) # Wait for initial load/redirect

            print(f"Current URL: {page.url}")
            page.screenshot(path="verification/debug_initial.png")

            # Try to find input by placeholder if label fails
            search_input = page.locator("input[name='search-repos-not-credentials']")
            if not search_input.is_visible():
                print("Input not visible by name, trying label...")
                search_input = page.get_by_label("Búsqueda de repositorios")

            expect(search_input).to_be_visible(timeout=10000)

            # Click and type
            search_input.click()
            search_input.type("repo")
            time.sleep(2) # Wait for results

            # Take screenshot
            page.screenshot(path="verification/search_final.png")
            print("Verification screenshot saved to verification/search_final.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    verify_search_ux()
