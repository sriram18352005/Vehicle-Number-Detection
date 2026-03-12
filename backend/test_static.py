from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn
import os

app = FastAPI()

# Mimic main.py path resolution
# If this script is in backend/, then BASE_DIR should be backend/
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "storage" / "uploads"

print(f"Base Dir: {BASE_DIR}")
print(f"Upload Dir: {UPLOAD_DIR}")
print(f"Upload Dir Exists: {UPLOAD_DIR.exists()}")

if not UPLOAD_DIR.exists():
    print("WARNING: Upload directory does not exist! Creating it for test.")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
else:
    with open("server_log.txt", "w", encoding="utf-8") as f:
        f.write(f"Listing files in {UPLOAD_DIR}:\n")
        try:
            for file in os.listdir(UPLOAD_DIR):
                f.write(f" - {file}\n")
        except Exception as e:
            f.write(f"Error listing files: {e}\n")

app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/")
def root():
    return {"message": "Static Test Server"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)
