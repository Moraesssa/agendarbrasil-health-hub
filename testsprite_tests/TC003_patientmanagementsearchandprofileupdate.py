import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8080"
TIMEOUT = 30
USERNAME = "https://ulebotjrsgheybhpdnxd.supabase.co"
PASSWORD = "Alberteinstein@1981"


def test_patient_management_search_and_profile_update():
    auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    created_patient_id = None

    try:
        # Step 1: Create a new patient profile (POST /patients)
        patient_data = {
            "firstName": "Test",
            "lastName": "Patient",
            "email": "test.patient@example.com",
            "phone": "+1234567890",
            "dateOfBirth": "1990-01-01",
            "address": "123 Test St",
            "gender": "Other"
        }
        create_response = requests.post(f"{BASE_URL}/patients", json=patient_data, headers=headers, auth=auth, timeout=TIMEOUT)
        assert create_response.status_code == 201, f"Expected 201 Created but got {create_response.status_code}"
        created_patient = create_response.json()
        created_patient_id = created_patient.get("id")
        assert created_patient_id is not None, "Created patient ID not returned"

        # Step 2: Search patient database by email to verify retrieval (GET /patients?email=...)
        search_params = {"email": patient_data["email"]}
        search_response = requests.get(f"{BASE_URL}/patients", headers=headers, auth=auth, params=search_params, timeout=TIMEOUT)
        assert search_response.status_code == 200, f"Expected 200 OK but got {search_response.status_code}"
        search_results = search_response.json()
        assert isinstance(search_results, list), "Search results should be a list"
        assert any(p.get("id") == created_patient_id for p in search_results), "Created patient not found in search results"

        # Step 3: Update patient profile information (PUT /patients/{id})
        updated_data = {
            "phone": "+0987654321",
            "address": "321 Updated Ave"
        }
        update_response = requests.put(f"{BASE_URL}/patients/{created_patient_id}", json=updated_data, headers=headers, auth=auth, timeout=TIMEOUT)
        assert update_response.status_code == 200, f"Expected 200 OK but got {update_response.status_code}"
        updated_patient = update_response.json()
        assert updated_patient.get("phone") == updated_data["phone"], "Phone number was not updated correctly"
        assert updated_patient.get("address") == updated_data["address"], "Address was not updated correctly"

        # Step 4: Retrieve the patient profile to validate update (GET /patients/{id})
        get_response = requests.get(f"{BASE_URL}/patients/{created_patient_id}", headers=headers, auth=auth, timeout=TIMEOUT)
        assert get_response.status_code == 200, f"Expected 200 OK but got {get_response.status_code}"
        patient_profile = get_response.json()
        assert patient_profile.get("phone") == updated_data["phone"], "Phone number mismatch in retrieved profile"
        assert patient_profile.get("address") == updated_data["address"], "Address mismatch in retrieved profile"

    finally:
        # Cleanup: Delete the created patient profile (DELETE /patients/{id})
        if created_patient_id:
            try:
                delete_response = requests.delete(f"{BASE_URL}/patients/{created_patient_id}", headers=headers, auth=auth, timeout=TIMEOUT)
                assert delete_response.status_code in {200, 204}, f"Failed to delete patient with status {delete_response.status_code}"
            except Exception:
                pass


test_patient_management_search_and_profile_update()