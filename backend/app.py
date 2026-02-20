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
    return jsonify({
        "status": "healthy",
        "message": "RetinaLens AI Backend is running",
        "upload_dir": str(os.path.exists(UPLOAD_FOLDER))
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
