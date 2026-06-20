import os
import re

html_files = [f for f in os.listdir('frontend') if f.endswith('.html')]
replacements = {
    'href="index.css"': 'href="css/index.css"',
    'href="style.css"': 'href="css/style.css"',
    'href="upload.css"': 'href="css/upload.css"',
    'src="login.js"': 'src="js/login.js"',
    'src="signup.js"': 'src="js/signup.js"'
}

for file in html_files:
    filepath = os.path.join('frontend', file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
print("Updated HTML paths.")
