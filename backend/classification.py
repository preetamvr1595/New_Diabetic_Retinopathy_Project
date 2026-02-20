import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import os
import gc

CLASSES = ["No_DR", "Mild_DR", "Severe_DR"]

def get_model():
    global model
    if model is not None:
        return model

    curr_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(curr_dir, "models", "dr_classifier.h5")
    
    if not os.path.exists(model_path):
        print(f"Warning: Classifier model not found at {model_path}")
        return None

    print(f"Loading Classifier from {model_path}...")
    try:
        model = load_model(model_path, compile=False)
        print("Classifier Loaded Successfully.")
    except Exception as e:
        print(f"Error loading classifier: {e}")
        model = None
    return model

model = None

def classify_image(image_path):
    global model
    if model is None:
        model = get_model()
    if model is None:
        return "Unknown", 0.0
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.resize(img, (224, 224))
    img = img / 255.0
    img = np.expand_dims(img, axis=(0, -1))

    preds = model.predict(img)[0]
    idx = np.argmax(preds)
    
    label = CLASSES[idx]
    conf = float(preds[idx])
    
    # Critical: Free memory
    model = None
    tf.keras.backend.clear_session()
    gc.collect()
    
    return label, conf
