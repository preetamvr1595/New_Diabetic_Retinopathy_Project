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

    token_prefix = api_key[:4] + "..." if len(api_key) > 4 else api_key
    DOWNLOAD_LOGS.append(f"GITHUB_API_KEY detected: {token_prefix} (length: {len(api_key)})")

    models = [
        "dr_classifier.h5",
        "attention_unet.h5"
    ]

    needs_lfs = False
    for model_name in models:
        model_path = os.path.join(models_dir, model_name)
        if not os.path.exists(model_path) or os.path.getsize(model_path) < 1000:
            needs_lfs = True
            DOWNLOAD_LOGS.append(f"Model {model_name} needs LFS pull.")
    
    if needs_lfs:
        try:
            # Detect project root (parent of backend folder)
            project_root = os.path.dirname(curr_dir)
            
            # Check if it's a git repo
            if not os.path.exists(os.path.join(project_root, ".git")):
                DOWNLOAD_LOGS.append("Not a git repo. Initializing temporary repo for LFS pull...")
                subprocess.run(["git", "init"], cwd=project_root, check=True)
            
            remote_url = f"https://{api_key}@github.com/{GITHUB_OWNER}/{GITHUB_REPO}.git"
            
            # Ensure origin exists and is correct
            subprocess.run(["git", "remote", "remove", "origin"], cwd=project_root, capture_output=True)
            subprocess.run(["git", "remote", "add", "origin", remote_url], cwd=project_root, check=True)
            
            DOWNLOAD_LOGS.append("Starting Git LFS Pull (root context)...")
            subprocess.run(["git", "lfs", "install"], cwd=project_root, check=True)
            
            # We only want to pull the models to save time/bandwidth
            result = subprocess.run(["git", "lfs", "pull", "--include", "backend/models/*"], 
                                    cwd=project_root, check=True, capture_output=True, text=True)
            
            DOWNLOAD_LOGS.append(f"Git LFS Pull finished logic. Output snippet: {result.stdout[:50]}")
            
            for model_name in models:
                model_path = os.path.join(models_dir, model_name)
                if os.path.exists(model_path):
                    size = os.path.getsize(model_path)
                    DOWNLOAD_LOGS.append(f"Verification: {model_name} size is {size}")
                    if size < 1000:
                        DOWNLOAD_LOGS.append(f"CRITICAL: {model_name} is still small! LFS pull failed to fetch content.")
        except Exception as e:
            DOWNLOAD_LOGS.append(f"Error during Git LFS Pull: {str(e)}")

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
