def get_user_backup(username):
    # Vulnerable: Exposes sensitive file location
    backup_path = f"/var/backups/users/{username}_backup.zip"
    error_msg = f"Backup not found at {backup_path}"  # Exposes full path in error message
    return error_msg


import os

def get_db_connection():
    # Vulnerable: Exposes environment details in errors
    try:
        db_password = os.environ['DB_PASSWORD']
        return connect_db(db_password)
    except Exception as e:
        # Reveals environment details in error message
        return f"Failed to connect using environment: {os.environ}"


def read_file(filename):
    # Vulnerable: Path traversal possible
    file_path = f"data/user_files/{filename}"
    with open(file_path, 'r') as f:
        return f.read()
    # Attacker can use "../" to access other directories


def ldap_lookup(username):
    # Vulnerable: LDAP injection possible
    ldap_query = f"(cn={username})"
    conn = ldap.initialize('ldap://example.com')
    # No input sanitization
    result = conn.search_s('dc=example,dc=com', ldap.SCOPE_SUBTREE, ldap_query)
    return result
