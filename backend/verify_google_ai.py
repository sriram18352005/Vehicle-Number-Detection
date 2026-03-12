import os
import sys
from app.core.config import settings

def verify_google_setup():
    print("--- Google Cloud Document AI Integration Check ---")
    
    # Check library
    try:
        import google.cloud.documentai
        print("[PASS] google-cloud-documentai library installed.")
    except ImportError:
        print("[FAIL] google-cloud-documentai library NOT found.")
        return

    # Check Configuration
    print(f"Project ID: {settings.GOOGLE_CLOUD_PROJECT}")
    print(f"Location: {settings.GOOGLE_CLOUD_LOCATION}")
    print(f"Processor ID: {settings.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}")
    
    if settings.GOOGLE_CLOUD_PROJECT == "your-project-id":
        print("[WARNING] GOOGLE_CLOUD_PROJECT is still set to placeholder.")
    else:
        print("[PASS] GOOGLE_CLOUD_PROJECT is configured.")

    # Check Credentials
    creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if creds:
        if os.path.exists(creds):
            print(f"[PASS] GOOGLE_APPLICATION_CREDENTIALS points to: {creds}")
        else:
            print(f"[FAIL] GOOGLE_APPLICATION_CREDENTIALS set but file NOT found at: {creds}")
    else:
        print("[FAIL] GOOGLE_APPLICATION_CREDENTIALS environment variable NOT set.")
    
    print("\nNext Steps:")
    print("1. Set environment variables in your .env file or terminal:")
    print("   GOOGLE_CLOUD_PROJECT=your-id")
    print("   GOOGLE_DOCUMENT_AI_PROCESSOR_ID=your-id")
    print("   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json")
    print("2. Restart the backend server.")

if __name__ == "__main__":
    verify_google_setup()
