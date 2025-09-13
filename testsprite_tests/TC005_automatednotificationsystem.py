import requests
from requests.auth import HTTPBasicAuth
import time

BASE_URL = "http://localhost:8080"
AUTH_USERNAME = "testuser"
AUTH_PASSWORD = "testpassword"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_automated_notification_system():
    """
    Test automated notifications for appointment confirmations,
    reminders 24 hours before appointments, and cancellations to reduce no-shows.
    """
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)

    # Helper function to create an appointment
    def create_appointment():
        appointment_data = {
            "patient_id": "test-patient-001",
            "doctor_id": "test-doctor-001",
            # Appointment scheduled 25 hours from now to test reminder 24h before
            "appointment_time": int(time.time()) + 25 * 3600,
            "reason": "Routine checkup"
        }
        response = requests.post(
            f"{BASE_URL}/api/appointments",
            json=appointment_data,
            headers=HEADERS,
            auth=auth,
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        return response.json()["id"]

    # Helper function to get notifications for an appointment
    def get_notifications(appointment_id):
        response = requests.get(
            f"{BASE_URL}/api/appointments/{appointment_id}/notifications",
            headers=HEADERS,
            auth=auth,
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        return response.json()

    # Helper function to cancel an appointment
    def cancel_appointment(appointment_id):
        response = requests.delete(
            f"{BASE_URL}/api/appointments/{appointment_id}",
            headers=HEADERS,
            auth=auth,
            timeout=TIMEOUT,
        )
        response.raise_for_status()

    appointment_id = None
    try:
        # Create a new appointment
        appointment_id = create_appointment()
        assert appointment_id is not None and isinstance(appointment_id, str)

        # Check for confirmation notification right after creation
        notifications = get_notifications(appointment_id)
        confirmation_notifications = [n for n in notifications if n.get("type") == "confirmation"]
        assert len(confirmation_notifications) > 0, "No confirmation notification sent"

        # Simulate advancing time to 1 hour before appointment to check reminder presence
        # Since we can't change server time, verify existence of reminder scheduled for 24h before
        reminders = [n for n in notifications if n.get("type") == "reminder"]
        # Reminder 24h before appointment should be scheduled, confirm it exists
        assert any(reminder.get("scheduled_for") == notifications[0].get("appointment_time") - 86400 for reminder in reminders), \
            "No 24-hour reminder scheduled"

        # Cancel the appointment to trigger cancellation notification
        cancel_appointment(appointment_id)

        # After cancellation, fetch notifications again to check for cancellation notification
        notifications_after_cancel = get_notifications(appointment_id)
        cancellation_notifications = [n for n in notifications_after_cancel if n.get("type") == "cancellation"]
        assert len(cancellation_notifications) > 0, "No cancellation notification sent"

    finally:
        if appointment_id:
            # Cleanup: try deleting appointment in case cancellation failed
            try:
                requests.delete(
                    f"{BASE_URL}/api/appointments/{appointment_id}",
                    headers=HEADERS,
                    auth=auth,
                    timeout=TIMEOUT,
                )
            except:
                pass

test_automated_notification_system()
