import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the application
        page.goto("http://127.0.0.1:8080/")
        print("Navigated to the page.")

        # Wait for the main page to load by looking for a unique element
        main_heading = page.get_by_role("main").get_by_text("Sua saúde em primeiro lugar")
        expect(main_heading).to_be_visible(timeout=10000)
        print("Landing page is visible.")

        # Click the button to start scheduling
        page.get_by_role("button", name="Agendar Consulta").first.click()
        print("Clicked 'Agendar Consulta' button.")

        # Now wait for the scheduling page to load
        expect(page.get_by_role("heading", name="Agendar Consulta")).to_be_visible(timeout=10000)
        print("Scheduling page heading is visible.")

        # --- Step 1: Select Specialty ---
        specialty_combo = page.get_by_role("combobox").first
        expect(specialty_combo).to_be_enabled()
        specialty_combo.click()
        page.get_by_text("Cardiologia").click()
        print("Selected specialty: Cardiologia")
        page.get_by_role("button", name="Próximo").click()

        expect(page.get_by_text("Passo 2 de 7")).to_be_visible()
        print("Advanced to Step 2.")

        # --- Step 2: Select State ---
        state_combo = page.get_by_role("combobox").first
        expect(state_combo).to_be_enabled()
        state_combo.click()
        page.get_by_text("SP").click()
        print("Selected state: SP")
        page.get_by_role("button", name="Próximo").click()
        expect(page.get_by_text("Passo 3 de 7")).to_be_visible()
        print("Advanced to Step 3.")

        # --- Step 3: Select City ---
        city_combo = page.get_by_role("combobox").first
        expect(city_combo).to_be_enabled()
        city_combo.click()
        page.get_by_text("São Paulo").click()
        print("Selected city: São Paulo")
        page.get_by_role("button", name="Próximo").click()
        expect(page.get_by_text("Passo 4 de 7")).to_be_visible()
        print("Advanced to Step 4.")

        # --- Step 4: Select Doctor ---
        doctor_combo = page.get_by_role("combobox").first
        expect(doctor_combo).to_be_enabled()
        doctor_combo.click()
        # There should be at least one doctor for this combination in the test data
        expect(page.locator('.cmdk-item')).to_have_count(1, timeout=5000)
        page.locator('.cmdk-item').first.click()
        print("Selected the first available doctor.")
        page.get_by_role("button", name="Próximo").click()
        expect(page.get_by_text("Passo 5 de 7")).to_be_visible()
        print("Advanced to Step 5.")

        # --- Step 5: Select Date ---
        page.get_by_role("gridcell", name="20", exact=True).click()
        print("Selected a date.")
        page.get_by_role("button", name="Próximo").click()
        expect(page.get_by_text("Passo 6 de 7")).to_be_visible()
        print("Advanced to Step 6.")

        # --- Step 6: Select Time ---
        page.locator("button[data-time]").first.click()
        print("Selected a time slot.")
        page.get_by_role("button", name="Próximo").click()
        expect(page.get_by_text("Passo 7 de 7")).to_be_visible()
        print("Advanced to Step 7: Confirmation")

        # --- Step 7: Confirmation ---
        expect(page.get_by_text("Resumo do Agendamento")).to_be_visible()
        print("Appointment summary is visible.")

        screenshot_path = "jules-scratch/verification/verification.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png", full_page=True)
        print("Error screenshot saved.")

    finally:
        context.close()
        browser.close()

with sync_playwright() as p:
    run(p)
