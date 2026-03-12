import requests
import time

url = "http://127.0.0.1:8000/api/v1/documents/upload"
filepath = "test_upload.txt"

# Ensure test file exists
with open(filepath, "w") as f:
    f.write("test content for API diagnostic")

print(f"[{time.time()}] STARTing API upload to {url}...")
try:
    with open(filepath, "rb") as f:
        files = {"file": f}
        # We need a token if it's protected. Let's see if we can get one or if it fails with 401.
        response = requests.post(url, files=files, timeout=30)
    
    print(f"[{time.time()}] RESPONSE CODE: {response.status_code}")
    print(f"[{time.time()}] RESPONSE BODY: {response.text}")
except Exception as e:
    print(f"[{time.time()}] API UPLOAD FAILED: {e}")
finally:
    if os.path.exists(filepath):
        os.remove(filepath)
