from http.server import BaseHTTPRequestHandler
import os
import tempfile
import subprocess
import json
import cgi
import io
import sys

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import process_data

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        # Parse multipart form data
        content_type = self.headers.get('Content-Type', '')
        if not content_type.startswith('multipart/form-data'):
            response = {"error": "Content-Type must be multipart/form-data"}
            self.wfile.write(json.dumps(response).encode())
            return

        # Parse the form data
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD': 'POST'}
        )

        # Check if file is provided
        if 'file' not in form:
            response = {"error": "No file provided"}
            self.wfile.write(json.dumps(response).encode())
            return

        file_item = form['file']
        if file_item.filename == '':
            response = {"error": "No file selected"}
            self.wfile.write(json.dumps(response).encode())
            return

        try:
            # Save file to a temporary location
            temp_file = tempfile.NamedTemporaryFile(delete=False)
            file_content = file_item.file.read()
            temp_file.write(file_content)
            temp_file.close()

            try:
                # Process the data using the existing process_data.py
                result_data = process_data.process_data(temp_file.name)
                self.wfile.write(json.dumps(result_data).encode())
            except Exception as e:
                response = {"error": f"Error processing data: {str(e)}"}
                self.wfile.write(json.dumps(response).encode())
            finally:
                # Clean up the temporary file
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
        except Exception as e:
            response = {"error": f"Internal server error: {str(e)}"}
            self.wfile.write(json.dumps(response).encode()) 