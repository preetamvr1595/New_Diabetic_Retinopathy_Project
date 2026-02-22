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

def download_models_if_needed():
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(curr_dir, "models")
    api_key = os.environ.get('GITHUB_API_KEY')
    
    if not api_key:
        print("GITHUB_API_KEY not found in environment. Skipping auto-download.")
        return

    models = [
        "dr_classifier.h5",
        "attention_unet.h5"
    ]

    for model_name in models:
        model_path = os.path.join(models_dir, model_name)
        needs_download = False
        
        if not os.path.exists(model_path):
            needs_download = True
            print(f"Model {model_name} missing. Downloading...")
        else:
            # Check if it's an LFS pointer (usually < 1KB)
            if os.path.getsize(model_path) < 1000:
                needs_download = True
                print(f"Model {model_name} appears to be an LFS pointer. Downloading full model...")
        
        if needs_download:
            url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/backend/models/{model_name}"
            headers = {
                "Authorization": f"token {api_key}",
                "Accept": "application/vnd.github.v3.raw"
            }
            
            try:
                print(f"Starting download of {model_name}...")
                with requests.get(url, headers=headers, stream=True) as r:
                    r.raise_for_status()
                    total_size = int(r.headers.get('content-length', 0))
                    downloaded = 0
                    start_time = time.time()
                    
                    with open(model_path, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                                downloaded += len(chunk)
                                if time.time() - start_time > 5: # Print progress every 5 seconds
                                    print(f"Downloading {model_name}: {downloaded}/{total_size} bytes ({(downloaded/total_size)*100:.2f}%)")
                                    start_time = time.time()
                print(f"Successfully downloaded {model_name}.")
            except Exception as e:
                print(f"Error downloading {model_name}: {e}")

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
