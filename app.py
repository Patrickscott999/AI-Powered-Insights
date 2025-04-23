from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import subprocess
import json

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({"status": "API is running"})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    # Save file to a temporary location
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    file.save(temp_file.name)
    temp_file.close()
    
    try:
        # Call the process_data.py script with the temporary file path
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "process_data.py")
        result = subprocess.run(
            ["python", script_path, temp_file.name], 
            capture_output=True, 
            text=True
        )
        
        # Extract stdout and stderr
        stdout = result.stdout
        stderr = result.stderr
        
        # Clean up the temporary file
        os.unlink(temp_file.name)
        
        # Log debug info from stderr
        if stderr:
            print("Python script debug info:", stderr)
        
        # Clean the stdout before parsing - extract only the JSON data
        json_str = stdout.strip()
        first_brace = json_str.find('{')
        last_brace = json_str.rfind('}')
        
        if first_brace >= 0 and last_brace >= 0 and last_brace > first_brace:
            json_str = json_str[first_brace:last_brace+1]
            
        # Parse the JSON data
        result_data = json.loads(json_str)
        
        # Check if the result contains an error
        if "error" in result_data:
            return jsonify({"error": result_data["error"]}), 500
            
        return jsonify(result_data)
        
    except Exception as e:
        # Clean up the temporary file in case of error
        try:
            os.unlink(temp_file.name)
        except:
            pass
        
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port) 