import requests
import os

BASE_URL = "http://localhost:8000/api/v1"

def run_diagnostic():
    # 1. Signup
    print("Attempting signup...")
    try:
        signup = requests.post(f"{BASE_URL}/auth/signup", json={
            "email": "diag_new@test.com",
            "password": "password123",
            "full_name": "Diag New"
        })
        print(f"Signup Result: {signup.status_code}")
    except Exception as e:
        print(f"Signup Failed: {e}")

    # 2. Login
    print("Attempting login...")
    token = None
    try:
        login = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "diag_new@test.com",
            "password": "password123"
        })
        if login.status_code == 200:
            token = login.json().get("access_token")
            print(f"Login SUCCESS - Token obtained.")
        else:
            print(f"Login Failed: {login.status_code} - {login.text}")
    except Exception as e:
        print(f"Login Error: {e}")

    if not token:
        print("DIAGNOSTIC FAILED - No token.")
        return

    # 3. Upload
    print("Attempting upload...")
    test_file = "diag_upload.txt"
    with open(test_file, "w") as f:
        f.write("Diagnostic document for forensic pipeline")

    try:
        with open(test_file, "rb") as f:
            headers = {"Authorization": f"Bearer {token}"}
            files = {"file": (test_file, f, "text/plain")}
            upload = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files)
            print(f"Upload Status: {upload.status_code}")
            print(f"Upload Response: {upload.text}")
    except Exception as e:
        print(f"Upload Error: {e}")
    finally:
        if os.path.exists(test_file):
            os.remove(test_file)

if __name__ == "__main__":
    run_diagnostic()
