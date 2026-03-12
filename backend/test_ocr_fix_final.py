from app.forensics.ocr_pipeline import perform_ocr
import os
import sys

# Add current directory to path so it can find 'app'
sys.path.append(os.getcwd())

def verify_fix():
    image_path = "test_image.png"
    if not os.path.exists(image_path):
        from PIL import Image, ImageDraw
        img = Image.new('RGB', (200, 100), color = (255, 255, 255))
        d = ImageDraw.Draw(img)
        d.text((10,10), "Test UID 123412341234", fill=(0,0,0))
        img.save(image_path)

    print(f"Testing perform_ocr with {image_path}...")
    try:
        results = perform_ocr(image_path)
        print("Success! results:")
        print(results)
        
        if results["text"] != "OCR Processing Failed":
            print("\nVERIFICATION PASSED: OCR returned content instead of failing.")
        else:
            print("\nVERIFICATION FAILED: Still showing 'OCR Processing Failed'.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\nVERIFICATION FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    verify_fix()
