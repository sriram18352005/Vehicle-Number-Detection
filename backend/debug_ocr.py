import sys
import os
import traceback

sys.path.append(os.getcwd())

from app.forensics.ocr_pipeline import perform_ocr

TEST_FILE = "storage/uploads/00a3301d-d4cb-49ca-a885-3e786b2ec863_preview.png"

if not os.path.exists(TEST_FILE):
    print(f"File not found: {TEST_FILE}")
    sys.exit(1)

print(f"Testing OCR on {TEST_FILE}...")
try:
    results = perform_ocr(TEST_FILE)
    print("Results:", results)
except Exception:
    traceback.print_exc()
