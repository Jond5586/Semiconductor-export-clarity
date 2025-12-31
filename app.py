from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['JSON_SORT_KEYS'] = False

SUBMISSIONS_FILE = 'submissions.json'

def load_submissions():
    """Load existing submissions from file."""
    if os.path.exists(SUBMISSIONS_FILE):
        with open(SUBMISSIONS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_submissions(submissions):
    """Save submissions to file."""
    with open(SUBMISSIONS_FILE, 'w') as f:
        json.dump(submissions, f, indent=2)

@app.route('/')
def index():
    """Serve the main HTML file."""
    return app.send_static_file('index.html')

@app.route('/api/submit-form', methods=['POST'])
def submit_form():
    """Handle form submission."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['organization', 'email', 'needs']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Create submission record
        submission = {
            'id': len(load_submissions()) + 1,
            'organization': data.get('organization', '').strip(),
            'email': data.get('email', '').strip(),
            'needs': data.get('needs', '').strip(),
            'timestamp': datetime.now().isoformat()
        }
        
        # Validate email format
        if '@' not in submission['email']:
            return jsonify({'success': False, 'message': 'Invalid email address'}), 400
        
        # Load, add new submission, and save
        submissions = load_submissions()
        submissions.append(submission)
        save_submissions(submissions)
        
        return jsonify({
            'success': True,
            'message': 'Your clarity review request has been submitted successfully!',
            'id': submission['id']
        }), 201
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error processing request: {str(e)}'}), 500

@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    """Get all submissions (for admin purposes)."""
    submissions = load_submissions()
    return jsonify(submissions), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
