import requests
import uuid

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

headers_json = {
    "Content-Type": "application/json"
}

def test_userauthenticationandprofilemanagement():
    session = requests.Session()
    session.headers.update(headers_json)

    # Helper functions for creating and deleting a user
    def register_user(email, password, role):
        url = f"{BASE_URL}/api/users/register"
        payload = {
            "email": email,
            "password": password,
            "role": role
        }
        resp = session.post(url, json=payload, timeout=TIMEOUT)
        return resp

    def login_user(email, password):
        url = f"{BASE_URL}/api/users/login"
        payload = {
            "email": email,
            "password": password
        }
        resp = session.post(url, json=payload, timeout=TIMEOUT)
        return resp

    def request_password_reset(email):
        url = f"{BASE_URL}/api/users/password-reset/request"
        payload = {"email": email}
        resp = session.post(url, json=payload, timeout=TIMEOUT)
        return resp

    def reset_password(token, new_password):
        url = f"{BASE_URL}/api/users/password-reset/confirm"
        payload = {"token": token, "new_password": new_password}
        resp = session.post(url, json=payload, timeout=TIMEOUT)
        return resp

    def get_user_profile(token):
        url = f"{BASE_URL}/api/users/profile"
        h = {"Authorization": f"Bearer {token}"}
        resp = session.get(url, headers=h, timeout=TIMEOUT)
        return resp

    def delete_user(user_id):
        url = f"{BASE_URL}/api/users/{user_id}"
        resp = session.delete(url, timeout=TIMEOUT)
        return resp

    # Use a unique email for registering a user
    test_email = f"testuser_{uuid.uuid4().hex}@example.com"
    test_password = "TestPass123!"
    test_role_patient = "Patient"
    test_role_doctor = "Doctor"
    test_role_admin = "Administrator"

    user_id = None
    access_token = None

    try:
        # 1. Register a new patient user
        resp_register = register_user(test_email, test_password, test_role_patient)
        assert resp_register.status_code == 201, f"User registration failed: {resp_register.text}"
        data_register = resp_register.json()
        user_id = data_register.get("id")
        assert user_id, "No user ID returned after registration"
        assert data_register.get("email") == test_email
        assert data_register.get("role") == test_role_patient

        # 2. Login with the newly registered user
        resp_login = login_user(test_email, test_password)
        assert resp_login.status_code == 200, f"Login failed: {resp_login.text}"
        data_login = resp_login.json()
        access_token = data_login.get("access_token")
        assert access_token, "No access token received on login"

        # 3. Access user profile with token
        resp_profile = get_user_profile(access_token)
        assert resp_profile.status_code == 200, f"Get profile failed: {resp_profile.text}"
        profile_data = resp_profile.json()
        assert profile_data.get("email") == test_email
        assert profile_data.get("role") == test_role_patient

        # 4. Request password reset
        resp_req_reset = request_password_reset(test_email)
        assert resp_req_reset.status_code in (200, 202), f"Password reset request failed: {resp_req_reset.text}"

        # For testing purpose, simulate token retrieval - in real tests this requires email capture.
        # Here assume an endpoint exists for test to fetch reset token, normally not exposed:
        # We'll skip this step as we cannot simulate email token retrieval without PRD detail.

        # 5. Test role-based access control (RBAC)
        # Trying to access admin resource as patient should be forbidden
        admin_resource_url = f"{BASE_URL}/api/admin/dashboard"
        headers_admin_test = {"Authorization": f"Bearer {access_token}"}
        resp_admin_access = session.get(admin_resource_url, headers=headers_admin_test, timeout=TIMEOUT)
        assert resp_admin_access.status_code in (403, 401), "Patient should not access admin resource"

        # Register an admin user to test admin RBAC
        admin_email = f"admin_{uuid.uuid4().hex}@example.com"
        admin_password = "AdminPass123!"
        resp_register_admin = register_user(admin_email, admin_password, test_role_admin)
        assert resp_register_admin.status_code == 201
        admin_id = resp_register_admin.json().get("id")
        assert admin_id

        # Login admin
        resp_login_admin = login_user(admin_email, admin_password)
        assert resp_login_admin.status_code == 200
        admin_token = resp_login_admin.json().get("access_token")
        assert admin_token

        # Admin should access admin resource
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        resp_admin_access_ok = session.get(admin_resource_url, headers=headers_admin, timeout=TIMEOUT)
        assert resp_admin_access_ok.status_code == 200, "Admin should access admin resource"

        # Register a doctor user to test doctor RBAC
        doctor_email = f"doctor_{uuid.uuid4().hex}@example.com"
        doctor_password = "DoctorPass123!"
        resp_register_doc = register_user(doctor_email, doctor_password, test_role_doctor)
        assert resp_register_doc.status_code == 201
        doctor_id = resp_register_doc.json().get("id")
        assert doctor_id

        # Login doctor
        resp_login_doc = login_user(doctor_email, doctor_password)
        assert resp_login_doc.status_code == 200
        doctor_token = resp_login_doc.json().get("access_token")
        assert doctor_token

        # Doctor attempts to access admin resource should be forbidden
        headers_doctor = {"Authorization": f"Bearer {doctor_token}"}
        resp_doc_admin_access = session.get(admin_resource_url, headers=headers_doctor, timeout=TIMEOUT)
        assert resp_doc_admin_access.status_code in (401, 403), "Doctor should not access admin resource"

        # Doctor accesses doctor resource
        doctor_resource_url = f"{BASE_URL}/api/doctor/schedule"
        resp_doc_access = session.get(doctor_resource_url, headers=headers_doctor, timeout=TIMEOUT)
        assert resp_doc_access.status_code == 200, "Doctor should access doctor resource"

        # Patient attempts to access doctor resource should be forbidden
        resp_patient_doc_access = session.get(doctor_resource_url, headers=headers_admin_test, timeout=TIMEOUT)
        assert resp_patient_doc_access.status_code in (401, 403), "Patient should not access doctor resource"

    finally:
        # Cleanup created users
        if user_id:
            delete_user(user_id)
        if 'admin_id' in locals() and admin_id:
            delete_user(admin_id)
        if 'doctor_id' in locals() and doctor_id:
            delete_user(doctor_id)

test_userauthenticationandprofilemanagement()
