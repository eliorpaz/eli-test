# Vulnerable function that demonstrates Path Traversal (CWE-6)
def read_user_file(filename):
    # WARNING: This is vulnerable to path traversal!
    file_path = f"/home/user/documents/{filename}"
    
    try:
        with open(file_path, 'r') as file:
            content = file.read()
            return content
    except Exception as e:
        return f"Error reading file: {str(e)}"

# Example usage that could be exploited
filename = "../../etc/passwd"  # Attacker input that traverses up directories
content = read_user_file(filename)
print(content)
