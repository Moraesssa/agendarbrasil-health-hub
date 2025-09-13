import requests

BASE_URL = "http://localhost:8080"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_doctor_and_availability_management():
    doctor_data = {
        "name": "Dr. John Test",
        "specialty": "Cardiology",
        "email": "dr.john.test@example.com",
        "phone": "+1234567890",
        "qualification": "MD",
        "years_of_experience": 10
    }
    working_hours_data = {
        "weekday": "Monday",
        "start_time": "09:00",
        "end_time": "17:00"
    }
    block_off_data = {
        "date": "2025-09-15",
        "start_time": "12:00",
        "end_time": "13:00",
        "reason": "Lunch break"
    }

    doctor_id = None
    try:
        # Create a new doctor profile
        response_create_doctor = requests.post(
            f"{BASE_URL}/api/doctors",
            json=doctor_data,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_create_doctor.status_code == 201, f"Doctor creation failed: {response_create_doctor.text}"
        doctor = response_create_doctor.json()
        doctor_id = doctor.get("id")
        assert doctor_id is not None, "Doctor ID not returned on creation"

        # Add working hours for the doctor
        response_add_hours = requests.post(
            f"{BASE_URL}/api/doctors/{doctor_id}/working-hours",
            json=working_hours_data,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_add_hours.status_code == 201, f"Adding working hours failed: {response_add_hours.text}"
        working_hours = response_add_hours.json()
        working_hours_id = working_hours.get("id")
        assert working_hours_id is not None, "Working hours ID not returned"

        # Block off unavailable times for the doctor
        response_block_off = requests.post(
            f"{BASE_URL}/api/doctors/{doctor_id}/block-offs",
            json=block_off_data,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_block_off.status_code == 201, f"Block off creation failed: {response_block_off.text}"
        block_off = response_block_off.json()
        block_off_id = block_off.get("id")
        assert block_off_id is not None, "Block off ID not returned"

        # Retrieve doctor profile and verify updates
        response_get_doctor = requests.get(
            f"{BASE_URL}/api/doctors/{doctor_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_get_doctor.status_code == 200, f"Get doctor failed: {response_get_doctor.text}"
        doctor_details = response_get_doctor.json()
        assert doctor_details["name"] == doctor_data["name"]
        assert any(wh["id"] == working_hours_id for wh in doctor_details.get("working_hours", [])), "Working hours not linked"
        assert any(bo["id"] == block_off_id for bo in doctor_details.get("block_offs", [])), "Block offs not linked"

        # Update working hours
        updated_hours = {
            "weekday": "Monday",
            "start_time": "10:00",
            "end_time": "18:00"
        }
        response_update_hours = requests.put(
            f"{BASE_URL}/api/doctors/{doctor_id}/working-hours/{working_hours_id}",
            json=updated_hours,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_update_hours.status_code == 200, f"Update working hours failed: {response_update_hours.text}"

        # Update block off time
        updated_block_off = {
            "date": "2025-09-15",
            "start_time": "12:30",
            "end_time": "13:30",
            "reason": "Extended lunch break"
        }
        response_update_block_off = requests.put(
            f"{BASE_URL}/api/doctors/{doctor_id}/block-offs/{block_off_id}",
            json=updated_block_off,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_update_block_off.status_code == 200, f"Update block off failed: {response_update_block_off.text}"

    finally:
        if doctor_id:
            # Clean up: delete doctor (assumed cascade deletes working hours and block offs)
            response_delete_doctor = requests.delete(
                f"{BASE_URL}/api/doctors/{doctor_id}",
                headers=HEADERS,
                timeout=TIMEOUT
            )
            # Allow 200 or 204 as successful delete
            assert response_delete_doctor.status_code in (200, 204), f"Delete doctor failed: {response_delete_doctor.text}"

test_doctor_and_availability_management()
