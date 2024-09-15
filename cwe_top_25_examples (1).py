import sqlite3
import os
import ctypes
from flask import Flask, request
# orongg
# CWE-89: SQL Injection
def sql_injection_example():
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT
    )
    ''')
    cursor.execute("INSERT INTO users (username, password) VALUES ('admin', 'password123')")
    cursor.execute("INSERT INTO users (username, password) VALUES ('user', 'mypassword')")
    conn.commit()

    def get_user(username, password):
        query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
        cursor.execute(query)
        return cursor.fetchall()

    username = "admin"
    password = "' OR '1'='1"
    print("CWE-89: SQL Injection")
    users = get_user(username, password)
    print(users)

    conn.close()

# CWE-78: OS Command Injection
def os_command_injection_example():
    def list_files(directory):
        command = f"ls {directory}"
        os.system(command)

    directory = "; echo 'Hello, World!'"
    print("CWE-78: OS Command Injection")
    list_files(directory)

# CWE-20: Improper Input Validation
def improper_input_validation_example():
    def calculate_discount(price, discount):
        if discount > 100:
            raise ValueError("Discount cannot be greater than 100%")
        return price - (price * (discount / 100))

    price = 100
    discount = 110

    print("CWE-20: Improper Input Validation")
    try:
        print(calculate_discount(price, discount))
    except ValueError as e:
        print(e)

# CWE-79: Cross-Site Scripting (XSS)
def xss_example():
    app = Flask(__name__)

    @app.route('/')
    def index():
        name = request.args.get('name', '')
        return f"<h1>Hello, {name}</h1>"

    print("CWE-79: Cross-Site Scripting (XSS)")
    if __name__ == "__main__":
        app.run(debug=True)

# CWE-22: Path Traversal
def path_traversal_example():
    def read_file(filename):
        with open(filename, 'r') as file:
            return file.read()

    filename = "../etc/passwd"
    print("CWE-22: Path Traversal")
    try:
        print(read_file(filename))
    except Exception as e:
        print(e)

# CWE-119: Buffer Overflow
def buffer_overflow_example():
    def buffer_overflow():
        buffer = ctypes.create_string_buffer(10)
        input_str = b"A" * 20
        ctypes.memmove(buffer, input_str, len(input_str))
        return buffer.raw

    print("CWE-119: Buffer Overflow")
    print(buffer_overflow())

# CWE-200: Information Exposure
def information_exposure_example():
    def print_user_info(username):
        users = {
            'admin': 'admin_secret',
            'user': 'user_secret'
        }
        if username in users:
            return f"User: {username}, Password: {users[username]}"
        else:
            return "User not found"

    print("CWE-200: Information Exposure")
    print(print_user_info('admin'))

# Run all examples
sql_injection_example()
os_command_injection_example()
improper_input_validation_example()
# Uncomment the line below to run the XSS example; Flask app needs to be run separately
# xss_example()
path_traversal_example()
buffer_overflow_example()
information_exposure_example()
