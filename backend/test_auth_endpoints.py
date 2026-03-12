from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_oauth_callback():
    print("Testing OAuth callback with missing params...")
    response = client.get("/api/v1/auth/callback")
    print(f"Status: {response.status_code}, Body: {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "partial"
    print("Success: Callback handles missing params gracefully.")

    print("\nTesting OAuth callback with full params...")
    response = client.get("/api/v1/auth/callback?code=testcode123&state=teststate")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    # code_preview is f"{code[:5]}..."
    assert data["code_preview"].startswith("testc")
    print("Success: Callback receives params correctly.")

def test_login_logic():
    print("\nTesting login endpoint (invalid user to check timing logs)...")
    # This will hit our new timing logic
    response = client.post("/api/v1/auth/login", json={"email": "nonexistent@example.com", "password": "password"})
    assert response.status_code == 401
    print("Success: Login route reached and handled invalid user (check logs for timing).")

if __name__ == "__main__":
    test_oauth_callback()
    test_login_logic()
