try:
    import easyocr
    print("easyocr imported")
except ImportError as e:
    print(f"easyocr NOT imported: {e}")

try:
    import pytesseract
    print("pytesseract imported")
except ImportError as e:
    print(f"pytesseract NOT imported: {e}")

try:
    import torch
    print(f"torch imported, version: {torch.__version__}")
except ImportError as e:
    print(f"torch NOT imported: {e}")

try:
    import cv2
    print("cv2 imported")
except ImportError as e:
    print(f"cv2 NOT imported: {e}")
