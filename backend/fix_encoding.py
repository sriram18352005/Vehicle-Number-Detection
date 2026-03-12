import os

def convert_to_utf8(filepath):
    try:
        with open(filepath, "rb") as f:
            content = f.read()
        
        # Try decoding as utf-16
        decoded = content.decode("utf-16")
        
        with open(filepath + ".utf8", "w", encoding="utf-8") as f:
            f.write(decoded)
        print(f"Successfully converted {filepath} to utf-8.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    convert_to_utf8("debug_output.txt")
