import os
import sys

base_dir = r"d:\Project\bandi\backend\src\main\java\com\bandi\backend"
updated_files = 0

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.java'):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                if '"/common_images/' in content:
                    content = content.replace('"/common_images/', '"/api/common_images/')
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f"Updated: {path}")
                    updated_files += 1
            except Exception as e:
                print(f"Error reading/writing {path}: {e}")

print(f"Total {updated_files} Java files updated.")
