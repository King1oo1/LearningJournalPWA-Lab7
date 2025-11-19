from flask import Flask, request, jsonify, render_template, send_from_directory
import json, os
from datetime import datetime

app = Flask(__name__)

# Updated to use backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

# Create backend directory if it doesn't exist
if not os.path.exists(BACKEND_DIR):
    os.makedirs(BACKEND_DIR)

DATA_FILE = os.path.join(BACKEND_DIR, "reflections.json")

def load_reflections():
    """Load reflections from JSON file in backend folder"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    return []

def save_reflections(reflections):
    """Save reflections to JSON file in backend folder"""
    with open(DATA_FILE, "w", encoding='utf-8') as f:
        json.dump(reflections, f, indent=4)

# ===== CRITICAL FIX: Serve service worker from root =====
@app.route('/sw.js')
def serve_sw():
    return send_from_directory('static/js', 'sw.js', mimetype='application/javascript')

# ===== CRITICAL FIX: Serve manifest.json =====
@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/json')

# Serve offline page
@app.route('/offline')
def offline():
    return render_template('offline.html')

# ===== CATCH-ALL ROUTE FOR PWA NAVIGATION =====
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/journal")
def journal():
    return render_template("journal.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/projects")
def projects():
    return render_template("projects.html")

# ===== API ROUTES =====
@app.route("/api/reflections", methods=["GET"])
def get_reflections():
    """Get all reflections"""
    reflections = load_reflections()
    return jsonify(reflections)

@app.route("/api/reflections", methods=["POST"])
def add_reflection():
    """Add a new reflection"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        name = data.get("name", "Anonymous").strip()
        reflection_text = data.get("reflection", "").strip()
        
        if not reflection_text:
            return jsonify({"error": "Reflection content cannot be empty"}), 400

        new_reflection = {
            "name": name if name else "Anonymous",
            "date": datetime.now().strftime("%a %b %d %Y"),
            "reflection": reflection_text
        }

        reflections = load_reflections()
        reflections.append(new_reflection)
        save_reflections(reflections)

        return jsonify(new_reflection), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Extra Feature: DELETE endpoint
@app.route("/api/reflections/<int:index>", methods=["DELETE"])
def delete_reflection(index):
    """Delete a reflection by index"""
    try:
        reflections = load_reflections()
        if 0 <= index < len(reflections):
            deleted_reflection = reflections.pop(index)
            save_reflections(reflections)
            return jsonify(deleted_reflection), 200
        else:
            return jsonify({"error": "Index out of range"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check endpoint for PWA
@app.route("/health")
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# ===== ERROR HANDLERS FOR PWA =====
@app.errorhandler(404)
def not_found(error):
    return render_template('offline.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True)