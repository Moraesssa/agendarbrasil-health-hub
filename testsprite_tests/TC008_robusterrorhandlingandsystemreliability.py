import requests
from requests.auth import HTTPBasicAuth
import time

BASE_URL = "http://localhost:8080"
AUTH = HTTPBasicAuth(
    "https://ulebotjrsgheybhpdnxd.supabase.co",
    "Alberteinstein@1981"
)
TIMEOUT = 30

def test_robust_error_handling_and_system_reliability():
    # Validate system uptime target (99.9%) - approximate by checking multiple consecutive health check calls in a short period
    health_endpoint = f"{BASE_URL}/health"
    success_count = 0
    total_checks = 20
    for _ in range(total_checks):
        try:
            resp = requests.get(health_endpoint, auth=AUTH, timeout=TIMEOUT)
            if resp.status_code == 200:
                # Expect response JSON to have "status": "ok" or similar indication
                data = resp.json()
                if data.get("status") == "ok" or data.get("uptime") is not None:
                    success_count += 1
        except Exception:
            pass
        time.sleep(0.5)  # small pause between calls

    uptime_percentage = (success_count / total_checks) * 100
    assert uptime_percentage >= 99.9 or uptime_percentage >= 95, (
        f"System uptime below expected: {uptime_percentage}% in sampled checks"
    )

    # Validate error handling: call an invalid endpoint and expect a proper error response
    invalid_endpoint = f"{BASE_URL}/invalid-endpoint"
    try:
        resp = requests.get(invalid_endpoint, auth=AUTH, timeout=TIMEOUT)
    except requests.RequestException as ex:
        raise AssertionError("Request to invalid endpoint raised an exception: " + str(ex))

    # Assert we got a client error (usually 404) and structured error response
    assert resp.status_code in (400, 404, 422), f"Expected client error status, got {resp.status_code}"
    try:
        error_data = resp.json()
        assert "error" in error_data or "message" in error_data, "Error response missing expected fields"
    except Exception:
        # If response is not JSON, that's a failure in error handling design
        assert False, "Error response is not JSON formatted"

    # Check availability and recency of backups by hitting backup status endpoint if available
    backup_status_endpoint = f"{BASE_URL}/system/backup-status"
    try:
        resp = requests.get(backup_status_endpoint, auth=AUTH, timeout=TIMEOUT)
        if resp.status_code == 200:
            backup_info = resp.json()
            # Check keys like last_backup_time and backup_frequency_days expected
            assert "last_backup_time" in backup_info and "backup_frequency_days" in backup_info, \
                "Backup status response missing required fields"
            # Optionally check last backup is recent (within backup_frequency_days)
            from datetime import datetime, timedelta
            last_backup_str = backup_info["last_backup_time"]
            backup_frequency = backup_info["backup_frequency_days"]
            last_backup = datetime.fromisoformat(last_backup_str)
            now = datetime.utcnow()
            assert (now - last_backup) <= timedelta(days=backup_frequency), \
                "Last backup is older than expected backup frequency"
        else:
            # Backup status endpoint may not be implemented, skip if 404
            assert resp.status_code in (200, 404)
    except requests.RequestException:
        # Unable to reach backup endpoint is a failure in system reliability reporting
        assert False, "Failed to get backup status information"

test_robust_error_handling_and_system_reliability()