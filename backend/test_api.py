import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/api/v1/documents/1", timeout=10)
    if response.status_code == 200:
        data = response.json()
        print("=== Document Info ===")
        print(f"ID: {data.get('id')}")
        print(f"Filename: {data.get('filename')}")
        print(f"File URL: {data.get('file_url')}")
        print(f"ELA URL: {data.get('ela_url')}")
        print(f"Status: {data.get('status')}")
        print(f"\n=== Testing Image Access ===")
        
        # Test if the image URL works
        if data.get('file_url'):
            img_url = f"http://127.0.0.1:8000{data.get('file_url')}"
            print(f"Testing: {img_url}")
            img_response = requests.head(img_url, timeout=5)
            print(f"Image Status Code: {img_response.status_code}")
            if img_response.status_code != 200:
                print("ERROR: Image not accessible!")
        
    else:
        print(f"Error: Status code {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
