import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8080"
AUTH_CREDENTIALS = HTTPBasicAuth(
    "https://ulebotjrsgheybhpdnxd.supabase.co",
    "Alberteinstein@1981"
)
TIMEOUT = 30

def test_role_based_access_control_features():
    """
    Test role-based access control restrictions for Administrator, Doctor, and Patient roles
    to ensure appropriate feature access.
    """

    # Define role-based expected accessible endpoints/features
    # For demonstration, assume the following API endpoints and required roles:
    # Admin can access /admin/dashboard
    # Doctor can access /doctor/schedule
    # Patient can access /patient/appointments

    role_endpoints = {
        "Administrator": "/admin/dashboard",
        "Doctor": "/doctor/schedule",
        "Patient": "/patient/appointments"
    }

    # Expected status code when allowed
    allowed_status_code = 200
    # Expected status code when forbidden
    forbidden_status_code = 403

    # Helper function to test access for a role
    def check_role_access(role, endpoint):
        url = BASE_URL + endpoint
        headers = {
            "Authorization-Role": role  # Assuming the app uses a header that defines role for testing
        }
        try:
            response = requests.get(
                url,
                auth=AUTH_CREDENTIALS,
                headers=headers,
                timeout=TIMEOUT
            )
        except requests.RequestException as e:
            assert False, f"Request failed for role {role} to endpoint {endpoint}: {str(e)}"

        # Validate response according to RBAC rules:
        # The user should have access only to their own role endpoint.
        # Accessing other role endpoints should be forbidden.
        for check_role, check_endpoint in role_endpoints.items():
            check_url = BASE_URL + check_endpoint
            headers_check = {"Authorization-Role": role}
            try:
                resp = requests.get(
                    check_url,
                    auth=AUTH_CREDENTIALS,
                    headers=headers_check,
                    timeout=TIMEOUT
                )
            except requests.RequestException as e:
                assert False, f"Request failed for role {role} to endpoint {check_endpoint}: {str(e)}"

            if role == check_role:
                assert resp.status_code == allowed_status_code, (
                    f"Role {role} should have access to {check_endpoint} but got status {resp.status_code}"
                )
            else:
                assert resp.status_code == forbidden_status_code, (
                    f"Role {role} should NOT have access to {check_endpoint} but got status {resp.status_code}"
                )

    # Run checks for each role
    for role, endpoint in role_endpoints.items():
        check_role_access(role, endpoint)

test_role_based_access_control_features()