import os
import re

# Emojis used in the project
EMOJIS = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]

def clean_file(filepath):
 try:
 with open(filepath, 'r', encoding='utf-8') as f:
 content = f.read()
 except UnicodeDecodeError:
 return # Skip non-text files
 
 modified = False
 for emoji in EMOJIS:
 if emoji in content:
 content = content.replace(emoji + " ", "")
 content = content.replace(emoji, "")
 modified = True
 
 if modified:
 # Also clean up double spaces created by emoji removal
 content = re.sub(r' +', ' ', content)
 with open(filepath, 'w', encoding='utf-8') as f:
 f.write(content)
 print(f"Cleaned {filepath}")

def main():
 target_dirs = ['.']
 for t_dir in target_dirs:
 for root, dirs, files in os.walk(t_dir):
 if 'node_modules' in root or 'venv' in root or '.git' in root or 'assets' in root:
 continue
 for file in files:
 if file.endswith(('.js', '.html', '.css', '.py', '.md')):
 clean_file(os.path.join(root, file))

if __name__ == '__main__':
 main()
