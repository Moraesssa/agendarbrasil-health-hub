import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8080"
USERNAME = "https://ulebotjrsgheybhpdnxd.supabase.co"
PASSWORD = "Alberteinstein@1981"
TIMEOUT = 30

def test_securityfeaturesdataencryptionandauthorization():
    # Use a test endpoint that requires strict authentication and deals with sensitive data
    # Since PRD doesn't specify exact security endpoints, we'll test access control and encryption presence
    sensitive_data_endpoint = f"{BASE_URL}/api/secure-data"

    auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {
        "Accept": "application/json"
    }

    try:
        # 1) Test authentication: valid credentials
        response = requests.get(sensitive_data_endpoint, auth=auth, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK for valid credentials, got {response.status_code}"
        # Validate that response data is encrypted or masked (simulate by checking header or content)
        # Assuming API sets a header 'Content-Encoding' or returns an encrypted payload indicator
        assert "Content-Encoding" in response.headers or "encrypted" in response.text.lower(), \
            "Response does not indicate data encryption"

        # 2) Test strict authorization: try accessing resource with no credentials
        response_no_auth = requests.get(sensitive_data_endpoint, headers=headers, timeout=TIMEOUT)
        assert response_no_auth.status_code == 401, f"Expected 401 Unauthorized for missing credentials, got {response_no_auth.status_code}"

        # 3) Test invalid credentials
        bad_auth = HTTPBasicAuth("invaliduser", "invalidpass")
        response_bad_auth = requests.get(sensitive_data_endpoint, auth=bad_auth, headers=headers, timeout=TIMEOUT)
        assert response_bad_auth.status_code == 401, f"Expected 401 Unauthorized for invalid credentials, got {response_bad_auth.status_code}"

        # 4) Authorization control: test role restriction if possible
        # For demonstration, assume endpoint /api/admin-data only accessible to admin role
        admin_endpoint = f"{BASE_URL}/api/admin-data"
        # Using valid auth but assuming this token is patient/doctor role (simulate by original auth)
        response_admin_access = requests.get(admin_endpoint, auth=auth, headers=headers, timeout=TIMEOUT)
        # Expect 403 Forbidden or 401 Unauthorized if not authorized
        assert response_admin_access.status_code in (401, 403), \
            f"Expected 401 or 403 for unauthorized role, got {response_admin_access.status_code}"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_securityfeaturesdataencryptionandauthorization()