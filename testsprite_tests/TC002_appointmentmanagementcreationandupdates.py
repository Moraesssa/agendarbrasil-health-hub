import requests
from requests.auth import HTTPBasicAuth
import datetime
import time

BASE_URL = "http://localhost:8080"
AUTH = HTTPBasicAuth(
    "https://ulebotjrsgheybhpdnxd.supabase.co",
    "Alberteinstein@1981"
)
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}
TIMEOUT = 30


def test_appointment_management_creation_and_updates():
    appointment_id = None
    try:
        # Step 1: Check availability for a doctor to prevent double booking
        doctor_id = 1  # Assumed doctor id for testing
        patient_id = 1  # Assumed patient id for testing

        # Prepare appointment datetime - 2 days from now at 10:00 AM
        appointment_datetime = (datetime.datetime.utcnow() + datetime.timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0)
        appointment_iso = appointment_datetime.isoformat() + 'Z'

        # Real-time availability check endpoint (assumed) GET /doctors/{doctor_id}/availability?datetime=...
        availability_check_url = f"{BASE_URL}/doctors/{doctor_id}/availability"
        resp_avail = requests.get(
            availability_check_url,
            params={"datetime": appointment_iso},
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_avail.status_code == 200, f"Availability check failed with status {resp_avail.status_code}"
        availability_data = resp_avail.json()
        assert isinstance(availability_data, dict), "Availability response is not a dict"
        assert availability_data.get("available") is True, f"Doctor is not available at {appointment_iso}."

        # Step 2: Create an appointment
        create_url = f"{BASE_URL}/appointments"
        appointment_payload = {
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "datetime": appointment_iso,
            "reason": "Routine checkup"
        }
        resp_create = requests.post(
            create_url,
            json=appointment_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_create.status_code == 201, f"Appointment creation failed: {resp_create.status_code}, {resp_create.text}"
        appointment = resp_create.json()
        appointment_id = appointment.get("id")
        assert appointment_id is not None, "Created appointment has no id"
        assert appointment.get("datetime") == appointment_iso, "Appointment datetime mismatch"
        assert appointment.get("doctor_id") == doctor_id, "Appointment doctor_id mismatch"
        assert appointment.get("patient_id") == patient_id, "Appointment patient_id mismatch"

        # Step 3: View appointment details
        get_url = f"{BASE_URL}/appointments/{appointment_id}"
        resp_get = requests.get(
            get_url,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_get.status_code == 200, f"Failed to get appointment details: {resp_get.status_code}"
        get_data = resp_get.json()
        assert get_data.get("id") == appointment_id, "Retrieved appointment id mismatch"
        assert get_data.get("datetime") == appointment_iso, "Retrieved appointment datetime mismatch"

        # Step 4: Update the appointment reason
        update_url = get_url
        updated_reason = "Updated reason: Follow-up visit"
        resp_update = requests.put(
            update_url,
            json={"reason": updated_reason},
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_update.status_code == 200, f"Appointment update failed: {resp_update.status_code}"
        update_data = resp_update.json()
        assert update_data.get("reason") == updated_reason, "Appointment reason update failed"

        # Step 5: Reschedule the appointment to a new datetime (1 hour later)
        new_datetime = (appointment_datetime + datetime.timedelta(hours=1)).isoformat() + "Z"

        # Check availability for new timeslot
        resp_avail_new = requests.get(
            availability_check_url,
            params={"datetime": new_datetime},
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_avail_new.status_code == 200, f"Availability check for reschedule failed"
        availability_new_data = resp_avail_new.json()
        assert availability_new_data.get("available") is True, "Doctor is not available for the rescheduled time"

        resp_reschedule = requests.put(
            update_url,
            json={"datetime": new_datetime},
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_reschedule.status_code == 200, f"Appointment reschedule failed: {resp_reschedule.status_code}"
        reschedule_data = resp_reschedule.json()
        assert reschedule_data.get("datetime") == new_datetime, "Appointment datetime not updated on reschedule"

        # Step 6: Attempt double booking on original timeslot (should fail)
        double_booking_payload = {
            "doctor_id": doctor_id,
            "patient_id": patient_id + 1,  # Different patient for testing double booking
            "datetime": appointment_iso,
            "reason": "Attempt double booking"
        }
        resp_double = requests.post(
            create_url,
            json=double_booking_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        # Assuming API returns 409 Conflict for double bookings
        assert resp_double.status_code == 409, f"Double booking prevention failed, status code {resp_double.status_code}"

        # Step 7: Cancel the appointment
        cancel_url = f"{BASE_URL}/appointments/{appointment_id}"
        resp_cancel = requests.delete(
            cancel_url,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_cancel.status_code in (200, 204), f"Appointment cancellation failed: {resp_cancel.status_code}"

        # Verify appointment is deleted or cancelled (GET should return 404 or status cancelled)
        resp_get_after_cancel = requests.get(
            get_url,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert resp_get_after_cancel.status_code in (404, 410), "Cancelled appointment should not be retrievable"

    finally:
        # Cleanup: Delete created appointment if still exists
        if appointment_id:
            try:
                cleanup_resp = requests.delete(
                    f"{BASE_URL}/appointments/{appointment_id}",
                    auth=AUTH,
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
                # Accept 200, 204, 404 (already deleted)
                assert cleanup_resp.status_code in (200, 204, 404)
            except Exception:
                pass


test_appointment_management_creation_and_updates()