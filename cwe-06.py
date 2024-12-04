# Example 1: Direct user input in file operations
def vulnerable_file_access1(user_input):
    with open(f"/var/www/{user_input}", "r") as f:  # Direct path injection
        return f.read()

# Example 2: Using os.path with user input
import os
def vulnerable_file_access2(user_input):
    path = os.path.join("/var/www", user_input)
    os.system(f"cat {path}")  # Command injection via path traversal

# Example 3: Using absolute paths with user input
def vulnerable_file_access3(user_path):
    if os.path.isabs(user_path):  # Even checking if absolute doesn't help
        with open(user_path, 'r') as f:
            return f.read()

# Example 4: Path traversal in web context
from flask import Flask, request
app = Flask(__name__)

@app.route('/download')
def download_file():
    filename = request.args.get('filename')
    filepath = os.path.join('/var/www/files', filename)
    return open(filepath, 'r').read()
