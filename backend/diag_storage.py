import os
from pathlib import Path

def check_storage():
    home = Path.home()
    al_data_dir = home / ".al_authenticator"
    storage_dir = al_data_dir / "storage_forensics"
    
    print(f"AL_DATA_DIR: {al_data_dir}")
    print(f"Storage Dir Exists: {storage_dir.exists()}")
    
    if storage_dir.exists():
        previews_dir = storage_dir / "previews"
        print(f"Previews Dir Exists: {previews_dir.exists()}")
        
        if previews_dir.exists():
            print("\nContents of Previews Dir:")
            for root, dirs, files in os.walk(previews_dir):
                level = root.replace(str(previews_dir), '').count(os.sep)
                indent = ' ' * 4 * (level)
                print('{}{}/'.format(indent, os.path.basename(root)))
                subindent = ' ' * 4 * (level + 1)
                for f in files:
                    print('{}{}'.format(subindent, f))

        print("\nPrimary Storage Contents:")
        for f in os.listdir(storage_dir):
            if os.path.isfile(storage_dir / f):
                print(f" - {f}")

if __name__ == "__main__":
    check_storage()
