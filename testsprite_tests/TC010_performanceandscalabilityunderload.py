import requests
import time
import threading
from base64 import b64encode

BASE_URL = "http://localhost:8080"
USERNAME = "https://ulebotjrsgheybhpdnxd.supabase.co"
PASSWORD = "Alberteinstein@1981"
TIMEOUT = 30

def get_auth_header(username, password):
    token = b64encode(f"{username}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}

auth_headers = get_auth_header(USERNAME, PASSWORD)

def create_appointment():
    url = f"{BASE_URL}/appointments"
    # Sample minimal appointment payload assuming patientId and doctorId exist and time slot in ISO 8601
    payload = {
        "patientId": "sample-patient-uuid",
        "doctorId": "sample-doctor-uuid",
        "startTime": "2025-09-15T10:00:00Z",
        "endTime": "2025-09-15T10:30:00Z",
        "reason": "Performance Test Booking"
    }
    response = requests.post(url, json=payload, headers=auth_headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def delete_appointment(appointment_id):
    url = f"{BASE_URL}/appointments/{appointment_id}"
    response = requests.delete(url, headers=auth_headers, timeout=TIMEOUT)
    response.raise_for_status()

def load_main_page():
    url = f"{BASE_URL}/"
    response = requests.get(url, headers=auth_headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response

def appointment_booking_under_500ms():
    start = time.perf_counter()
    appointment = create_appointment()
    duration_ms = (time.perf_counter() - start) * 1000
    try:
        assert duration_ms < 500, f"Appointment booking latency too high: {duration_ms:.2f}ms"
        assert "id" in appointment, "Created appointment response missing 'id'"
    finally:
        if "id" in appointment:
            delete_appointment(appointment["id"])

def page_load_under_3_seconds():
    start = time.perf_counter()
    response = load_main_page()
    duration_s = time.perf_counter() - start
    assert duration_s < 3, f"Page load time too high: {duration_s:.2f}s"
    assert response.status_code == 200, f"Unexpected page response status: {response.status_code}"

def concurrency_support_without_degradation():
    concurrency_level = 20
    durations = []
    errors = []

    def task():
        try:
            start = time.perf_counter()
            appointment = create_appointment()
            dur_ms = (time.perf_counter() - start) * 1000
            if dur_ms >= 500:
                errors.append(f"Booking latency exceeded 500ms: {dur_ms:.2f}ms")
            durations.append(dur_ms)
            if "id" in appointment:
                delete_appointment(appointment["id"])
        except Exception as e:
            errors.append(f"Exception during concurrent booking: {str(e)}")

    threads = []
    for _ in range(concurrency_level):
        t = threading.Thread(target=task)
        t.start()
        threads.append(t)
    for t in threads:
        t.join()

    assert not errors, f"Errors during concurrency test: {errors}"
    avg_duration = sum(durations) / len(durations) if durations else 0
    assert avg_duration < 500, f"Average booking latency too high under concurrency: {avg_duration:.2f}ms"

def test_performance_and_scalability_under_load():
    appointment_booking_under_500ms()
    page_load_under_3_seconds()
    concurrency_support_without_degradation()

test_performance_and_scalability_under_load()