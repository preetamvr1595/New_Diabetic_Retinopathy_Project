from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import cv2
import numpy as np
import base64
import uuid
from filters import apply_all_filters
from segmentation import segment_image
from classification import classify_image
import requests
import time

# GitHub details for downloading models if they are LFS pointers
GITHUB_OWNER = "preetamvr1595"
GITHUB_REPO = "New_Diabetic_Retinopathy_Project"

import shutil
import tempfile
import subprocess

# Global variable to store download logs for health check
DOWNLOAD_LOGS = []

def download_models_if_needed():
    global DOWNLOAD_LOGS
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(curr_dir, "models")
    api_key = os.environ.get('GITHUB_API_KEY')
    
    if not api_key:
        msg = "GITHUB_API_KEY not found in environment. Skipping auto-download."
        print(msg)
        DOWNLOAD_LOGS.append(msg)
        return

    # Log token properties for debugging (hidden value)
    token_prefix = api_key[:4] + "..." if len(api_key) > 4 else api_key
    DOWNLOAD_LOGS.append(f"GITHUB_API_KEY detected: {token_prefix} (length: {len(api_key)})")

    models = [
        "dr_classifier.h5",
        "attention_unet.h5"
    ]

    needs_download = False
    for model_name in models:
        model_path = os.path.join(models_dir, model_name)
        if not os.path.exists(model_path) or os.path.getsize(model_path) < 1000:
            needs_download = True
            DOWNLOAD_LOGS.append(f"Model {model_name} needs full download.")
    
    if needs_download:
        temp_repo_dir = None
        try:
            DOWNLOAD_LOGS.append("Starting fresh git clone (Attempt 2) to fetch LFS models...")
            temp_repo_dir = tempfile.mkdtemp()
            
            # Use the token for the clone URL
            clone_url = f"https://{api_key}@github.com/{GITHUB_OWNER}/{GITHUB_REPO}.git"
            
            # Clone with --depth 1 (includes LFS files if git-lfs is installed)
            result = subprocess.run([
                "git", "clone", "--depth", "1", clone_url, temp_repo_dir
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                DOWNLOAD_LOGS.append(f"Git Clone Failed: {result.stderr[:200]}")
                return

            DOWNLOAD_LOGS.append("Clone successful. Verifying models in clone...")
            
            # Source path in the cloned repo
            src_models_dir = os.path.join(temp_repo_dir, "backend", "models")
            
            for model_name in models:
                src_path = os.path.join(src_models_dir, model_name)
                dest_path = os.path.join(models_dir, model_name)
                
                if os.path.exists(src_path):
                    size = os.path.getsize(src_path)
                    DOWNLOAD_LOGS.append(f"Found {model_name} in clone (size: {size}).")
                    if size > 1000:
                        shutil.copy2(src_path, dest_path)
                        DOWNLOAD_LOGS.append(f"Successfully replaced {model_name} with full version.")
                    else:
                        DOWNLOAD_LOGS.append(f"WARNING: {model_name} in clone is ALSO an LFS pointer!")
                else:
                    DOWNLOAD_LOGS.append(f"Could not find {model_name} in cloned repository at {src_path}")
                    
        except Exception as e:
            DOWNLOAD_LOGS.append(f"Error during model fetch: {str(e)}")
        finally:
            if temp_repo_dir and os.path.exists(temp_repo_dir):
                shutil.rmtree(temp_repo_dir, ignore_errors=True)
                DOWNLOAD_LOGS.append("Cleaned up temporary clone.")

# Call download logic before starting
download_models_if_needed()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allow all origins for API in production

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

print(f"Server starting. Upload folder: {UPLOAD_FOLDER}")

# Helper to encode image to base64
def encode_image(img_path):
    if not os.path.exists(img_path):
        return None
    with open(img_path, "rb") as f:
        return base64.b64encode(f.read()).decode('utf-8')

def encode_cv2_image(img_array):
    _, buffer = cv2.imencode('.jpg', img_array)
    return base64.b64encode(buffer).decode('utf-8')

@app.route('/api/health', methods=['GET'])
def health_check():
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(curr_dir, "models")
    model_stats = {}
    
    if os.path.exists(models_dir):
        for f in os.listdir(models_dir):
            if f.endswith('.h5'):
                path = os.path.join(models_dir, f)
                model_stats[f] = {
                    "exists": True,
                    "size": os.path.getsize(path)
                }
    
    return jsonify({
        "status": "healthy",
        "message": "RetinaLens AI Backend is running",
        "upload_dir": str(os.path.exists(UPLOAD_FOLDER)),
        "models": model_stats,
        "download_logs": DOWNLOAD_LOGS,
        "mode": "production",
        "env": os.environ.get('RAILWAY_ENVIRONMENT', 'unknown')
    })

@app.route('/api/upload', methods=['POST'])
def upload_image():
    print("Received upload request")
    if 'image' not in request.files:
        print("Error: No image part in request")
        return jsonify({"error": "No image part"}), 400
    file = request.files['image']
    print(f"File received: {file.filename}")
    if file.filename == '':
        print("Error: Empty filename")
        return jsonify({"error": "No selected file"}), 400
    
    # Save file with unique ID
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    return jsonify({
        "message": "Image uploaded successfully",
        "id": filename,
        "url": f"/uploads/{filename}",
        "base64": encode_image(filepath) # Send back preview
    })

@app.route('/api/filters/<image_id>', methods=['GET'])
def get_filters(image_id):
    filepath = os.path.join(UPLOAD_FOLDER, image_id)
    if not os.path.exists(filepath):
        return jsonify({"error": "Image not found"}), 404
        
    # Apply filters
    try:
        results = apply_all_filters(filepath)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    # Format response
    response_data = []
    for name, data in results.items():
        response_data.append({
            "name": name,
            "metrics": data['metrics'],
            "image": encode_cv2_image(data['image'])
        })
        
    return jsonify(response_data)

@app.route('/api/segment/<image_id>', methods=['GET'])
def get_segmentation(image_id):
    filepath = os.path.join(UPLOAD_FOLDER, image_id)
    if not os.path.exists(filepath):
        return jsonify({"error": "Image not found"}), 404
        
    try:
        mask_path = segment_image(filepath)
        if mask_path is None:
            return jsonify({"error": "Segmentation failed"}), 500
            
        return jsonify({
            "original": encode_image(filepath),
            "mask": encode_image(mask_path)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/classify/<image_id>', methods=['GET'])
def get_classification(image_id):
    filepath = os.path.join(UPLOAD_FOLDER, image_id)
    if not os.path.exists(filepath):
        return jsonify({"error": "Image not found"}), 404
        
    try:
        label, confidence = classify_image(filepath)
        return jsonify({
            "label": label,
            "confidence": float(confidence)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask Server on port {port}...")
    app.run(host='0.0.0.0', debug=False, port=port)
