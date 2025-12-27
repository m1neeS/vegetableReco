"""
Model management for vegetable classification.
Handles model loading, image preprocessing, and inference.
"""
import os
import io
import logging
from typing import Dict, List, Any, Optional
import numpy as np
from PIL import Image
import tensorflow as tf

logger = logging.getLogger(__name__)

# Class names for the 15 vegetable types
CLASS_NAMES = [
    "Bean", "Bitter_Gourd", "Bottle_Gourd", "Brinjal", "Broccoli",
    "Cabbage", "Capsicum", "Carrot", "Cauliflower", "Cucumber",
    "Papaya", "Potato", "Pumpkin", "Radish", "Tomato"
]

# Model configuration
IMG_SIZE = (224, 224)
LOW_CONFIDENCE_THRESHOLD = 0.5


class VegetableModel:
    """Handles vegetable classification model operations."""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the model handler.
        
        Args:
            model_path: Path to the saved model. Defaults to models/best_model.h5
        """
        self.model_path = model_path or os.environ.get(
            "MODEL_PATH", 
            os.path.join(os.path.dirname(__file__), "../../models/best_model.h5")
        )
        # Also check for SavedModel format
        self.saved_model_path = os.environ.get(
            "SAVED_MODEL_PATH",
            os.path.join(os.path.dirname(__file__), "../../models/saved_model")
        )
        self.model: Optional[tf.keras.Model] = None
        self.is_loaded = False
        self.class_names = CLASS_NAMES
    
    def load_model(self) -> bool:
        """
        Load the trained model from disk.
        
        Returns:
            True if model loaded successfully, False otherwise.
        """
        try:
            # Try SavedModel format first (more portable)
            saved_model_paths = [
                self.saved_model_path,
                "models/saved_model",
                "../models/saved_model",
                "/app/models/saved_model"
            ]
            
            for path in saved_model_paths:
                if os.path.exists(path) and os.path.isdir(path):
                    logger.info(f"Loading SavedModel from: {path}")
                    self.model = tf.saved_model.load(path)
                    self.is_loaded = True
                    logger.info("SavedModel loaded successfully")
                    return True
            
            # Fallback to .h5 format
            h5_paths = [
                self.model_path,
                "models/best_model.h5",
                "../models/best_model.h5",
                "/app/models/best_model.h5"
            ]
            
            for path in h5_paths:
                if os.path.exists(path):
                    logger.info(f"Loading H5 model from: {path}")
                    # Try loading with compile=False for cross-version compatibility
                    try:
                        self.model = tf.keras.models.load_model(path, compile=False)
                    except Exception as e1:
                        logger.warning(f"Failed with compile=False, trying safe_mode: {e1}")
                        try:
                            self.model = tf.keras.models.load_model(path, compile=False, safe_mode=False)
                        except Exception as e2:
                            logger.warning(f"Failed with safe_mode=False, trying custom_objects: {e2}")
                            # Last resort: try with custom objects
                            self.model = tf.keras.models.load_model(
                                path, 
                                compile=False,
                                custom_objects={'InputLayer': tf.keras.layers.InputLayer}
                            )
                    self.is_loaded = True
                    logger.info("H5 model loaded successfully")
                    return True
            
            logger.warning(f"Model file not found. Tried SavedModel paths: {saved_model_paths}, H5 paths: {h5_paths}")
            self.is_loaded = False
            return False
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.is_loaded = False
            return False

    
    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Preprocess image for model inference.
        
        Converts image to RGB, resizes to 224x224, and normalizes pixel values.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Preprocessed image array with shape (1, 224, 224, 3)
            
        Raises:
            ValueError: If image cannot be processed
        """
        try:
            # Load image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB (handles RGBA, grayscale, etc.)
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Resize to target size (224x224)
            image = image.resize(IMG_SIZE, Image.Resampling.LANCZOS)
            
            # Convert to numpy array
            img_array = np.array(image, dtype=np.float32)
            
            # Normalize to [0, 1]
            img_array = img_array / 255.0
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise ValueError(f"Failed to preprocess image: {e}")
    
    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Run prediction on an image.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Dictionary containing:
                - predicted_class: The predicted vegetable class
                - confidence: Confidence score (0-1)
                - top_3: List of top 3 predictions with class and confidence
                
        Raises:
            ValueError: If image cannot be processed
            RuntimeError: If model is not loaded
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model not loaded")
        
        # Preprocess image
        processed_image = self.preprocess_image(image_bytes)
        
        # Run inference - handle both Keras model and SavedModel
        if hasattr(self.model, 'predict'):
            # Keras model
            predictions = self.model.predict(processed_image, verbose=0)
            probabilities = predictions[0]
        else:
            # SavedModel - use serve signature
            input_tensor = tf.constant(processed_image)
            predictions = self.model.signatures['serve'](input_tensor)
            # Get the output tensor (usually the first/only output)
            output_key = list(predictions.keys())[0]
            probabilities = predictions[output_key].numpy()[0]
        
        # Get top 3 predictions
        top_3_indices = np.argsort(probabilities)[-3:][::-1]
        top_3 = [
            {
                "class": self.class_names[idx],
                "confidence": float(probabilities[idx])
            }
            for idx in top_3_indices
        ]
        
        # Get best prediction
        best_idx = top_3_indices[0]
        best_confidence = float(probabilities[best_idx])
        
        # Handle low confidence
        if best_confidence < LOW_CONFIDENCE_THRESHOLD:
            predicted_class = "Unknown vegetable"
        else:
            predicted_class = self.class_names[best_idx]
        
        return {
            "predicted_class": predicted_class,
            "confidence": best_confidence,
            "top_3": top_3
        }
