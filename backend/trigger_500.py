import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def get_token():
    # Attempt to login with known user
    # Note: Using common password 'password123' as a guess if not known
    # If this fails, we'll try to signup.
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data={"username": "vvsriram05@gmail.com", "password": "password123"})
        if response.status_code == 200:
            return response.json()["access_token"]
    except:
        pass
    
    # Try signup if login fails
    try:
        requests.post(f"{BASE_URL}/auth/signup", json={"email": "diag@test.com", "password": "password123", "full_name": "Diag Test"})
        response = requests.post(f"{BASE_URL}/auth/login", data={"username": "diag@test.com", "password": "password123"})
        return response.json()["access_token"]
    except:
        return None

def test_upload():
    token = get_token()
    if not token:
        print("Could not get token.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    with open("test_upload.txt", "w") as f:
        f.write("test content for forensic bypass diagnostic")
    
    with open("test_upload.txt", "rb") as f:
        files = {"file": ("test_upload.txt", f, "text/plain")}
        response = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Body: {response.text}")

if __name__ == "__main__":
    test_upload()
