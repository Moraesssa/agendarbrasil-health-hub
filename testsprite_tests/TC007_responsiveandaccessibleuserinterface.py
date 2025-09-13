import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8080"
USERNAME = "https://ulebotjrsgheybhpdnxd.supabase.co"
PASSWORD = "Alberteinstein@1981"
TIMEOUT = 30

def test_responsive_and_accessible_user_interface():
    """
    Test the user interface responsiveness across multiple device types and compliance with WCAG accessibility standards.
    This test simulates requests with different user-agent headers representing multiple device types and checks
    that the server returns valid HTML content that includes WCAG compliance indicators.
    """

    user_agents = {
        "desktop": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"\
                   " Chrome/115.0.0.0 Safari/537.36",
        "mobile": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15"\
                  " (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "tablet": "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15"\
                  " (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "screen_reader": "Mozilla/5.0 (compatible; NVDA 2021.2; Windows NT 10.0; Win64; x64)",
    }

    # Endpoint assumed for UI homepage or main page
    endpoint = f"{BASE_URL}/"

    auth = HTTPBasicAuth(USERNAME, PASSWORD)

    for device, ua in user_agents.items():
        headers = {
            "User-Agent": ua,
            "Accept": "text/html",
        }
        try:
            response = requests.get(endpoint, headers=headers, auth=auth, timeout=TIMEOUT)
            response.raise_for_status()
        except requests.RequestException as e:
            assert False, f"Request for device '{device}' failed: {e}"

        content_type = response.headers.get('Content-Type', '')
        assert "text/html" in content_type, f"Expected 'text/html' content-type for {device}, got {content_type}"
        html_content = response.text.lower()

        # WCAG compliance basic checks in HTML:
        #  - Presence of lang attribute in html tag
        #  - Presence of aria-label or role attributes (expanded to include aria-labelledby and aria-describedby)
        #  - Presence of skip-links for keyboard navigation
        assert '<html lang="' in html_content, f"Missing lang attribute in <html> tag for {device}"
        assert ('aria-label' in html_content or 'aria-labelledby' in html_content or 'role=' in html_content or 'aria-describedby' in html_content), f"Missing ARIA attributes in HTML for {device}"
        assert 'skip to content' in html_content or 'skip-link' in html_content or 'skip navigation' in html_content, f"Missing skip links for {device}"

        # Responsive design checks (checking viewport meta tag presence)
        assert '<meta name="viewport"' in html_content, f"Missing viewport meta tag for responsive design on {device}"

def run_test():
    test_responsive_and_accessible_user_interface()

run_test()
