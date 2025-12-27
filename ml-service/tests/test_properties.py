"""
Property-based tests for ML Service.

Feature: vegetable-recognition-app
Tests correctness properties for image preprocessing and prediction.
"""
import io
import pytest
from hypothesis import given, strategies as st, settings, assume
from PIL import Image
import numpy as np

from app.model import VegetableModel, IMG_SIZE, LOW_CONFIDENCE_THRESHOLD, CLASS_NAMES


def create_test_image(width: int, height: int, mode: str = "RGB") -> bytes:
    """Create a test image with given dimensions and mode."""
    if mode == "RGB":
        img_array = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    elif mode == "RGBA":
        img_array = np.random.randint(0, 256, (height, width, 4), dtype=np.uint8)
    elif mode == "L":  # Grayscale
        img_array = np.random.randint(0, 256, (height, width), dtype=np.uint8)
    else:
        img_array = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    
    img = Image.fromarray(img_array, mode=mode)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


class TestImagePreprocessingConsistency:
    """
    Feature: vegetable-recognition-app
    Property 1: Image Preprocessing Consistency
    
    For any valid image input (JPEG, PNG, WebP), the ML_Service SHALL 
    preprocess it to exactly 224x224 pixels before inference.
    
    Validates: Requirements 2.1, 2.5
    """
    
    @given(
        width=st.integers(min_value=10, max_value=1000),
        height=st.integers(min_value=10, max_value=1000)
    )
    @settings(max_examples=100, deadline=None)
    def test_preprocessing_produces_correct_dimensions(self, width: int, height: int):
        """
        Property 1: Image Preprocessing Consistency
        For any valid image of any size, preprocessing SHALL produce 224x224 output.
        """
        model = VegetableModel()
        image_bytes = create_test_image(width, height)
        
        result = model.preprocess_image(image_bytes)
        
        # Verify output shape is (1, 224, 224, 3)
        assert result.shape == (1, 224, 224, 3), \
            f"Expected shape (1, 224, 224, 3), got {result.shape}"
    
    @given(mode=st.sampled_from(["RGB", "RGBA", "L"]))
    @settings(max_examples=100, deadline=None)
    def test_preprocessing_handles_different_color_modes(self, mode: str):
        """
        Property 1: Image Preprocessing Consistency
        For any valid image mode (RGB, RGBA, grayscale), preprocessing SHALL 
        convert to RGB and produce 224x224x3 output.
        """
        model = VegetableModel()
        image_bytes = create_test_image(100, 100, mode=mode)
        
        result = model.preprocess_image(image_bytes)
        
        # Verify output is always RGB (3 channels)
        assert result.shape == (1, 224, 224, 3), \
            f"Expected 3 channels for mode {mode}, got shape {result.shape}"
    
    @given(
        width=st.integers(min_value=10, max_value=500),
        height=st.integers(min_value=10, max_value=500)
    )
    @settings(max_examples=100, deadline=None)
    def test_preprocessing_normalizes_pixel_values(self, width: int, height: int):
        """
        Property 1: Image Preprocessing Consistency
        For any valid image, pixel values SHALL be normalized to [0, 1] range.
        """
        model = VegetableModel()
        image_bytes = create_test_image(width, height)
        
        result = model.preprocess_image(image_bytes)
        
        # Verify pixel values are in [0, 1] range
        assert result.min() >= 0.0, f"Min value {result.min()} is below 0"
        assert result.max() <= 1.0, f"Max value {result.max()} is above 1"



class TestPredictionOutputCompleteness:
    """
    Feature: vegetable-recognition-app
    Property 2: Prediction Output Completeness
    
    For any valid preprocessed image, the Classifier SHALL return a response 
    containing: predicted class (string), confidence score (0-1), and exactly 
    3 top predictions each with class and confidence.
    
    Validates: Requirements 2.2, 2.3
    """
    
    def test_prediction_output_structure(self):
        """
        Property 2: Prediction Output Completeness
        For any valid image, prediction output SHALL contain all required fields.
        """
        model = VegetableModel()
        model.load_model()
        
        # Skip if model not available
        if not model.is_loaded:
            pytest.skip("Model not loaded - skipping prediction test")
        
        image_bytes = create_test_image(224, 224)
        result = model.predict(image_bytes)
        
        # Verify required fields exist
        assert "predicted_class" in result, "Missing 'predicted_class' field"
        assert "confidence" in result, "Missing 'confidence' field"
        assert "top_3" in result, "Missing 'top_3' field"
        
        # Verify types
        assert isinstance(result["predicted_class"], str), \
            "predicted_class should be string"
        assert isinstance(result["confidence"], float), \
            "confidence should be float"
        assert isinstance(result["top_3"], list), \
            "top_3 should be list"
        
        # Verify top_3 has exactly 3 items
        assert len(result["top_3"]) == 3, \
            f"top_3 should have exactly 3 items, got {len(result['top_3'])}"
        
        # Verify each top_3 item structure
        for i, item in enumerate(result["top_3"]):
            assert "class" in item, f"top_3[{i}] missing 'class' field"
            assert "confidence" in item, f"top_3[{i}] missing 'confidence' field"
            assert isinstance(item["class"], str), \
                f"top_3[{i}]['class'] should be string"
            assert isinstance(item["confidence"], float), \
                f"top_3[{i}]['confidence'] should be float"
    
    def test_confidence_score_range(self):
        """
        Property 2: Prediction Output Completeness
        For any prediction, confidence scores SHALL be in [0, 1] range.
        """
        model = VegetableModel()
        model.load_model()
        
        if not model.is_loaded:
            pytest.skip("Model not loaded - skipping prediction test")
        
        image_bytes = create_test_image(224, 224)
        result = model.predict(image_bytes)
        
        # Verify main confidence is in range
        assert 0.0 <= result["confidence"] <= 1.0, \
            f"Main confidence {result['confidence']} not in [0, 1]"
        
        # Verify all top_3 confidences are in range
        for i, item in enumerate(result["top_3"]):
            assert 0.0 <= item["confidence"] <= 1.0, \
                f"top_3[{i}] confidence {item['confidence']} not in [0, 1]"
    
    def test_top_3_sorted_descending(self):
        """
        Property 2: Prediction Output Completeness
        For any prediction, top_3 SHALL be sorted by confidence in descending order.
        """
        model = VegetableModel()
        model.load_model()
        
        if not model.is_loaded:
            pytest.skip("Model not loaded - skipping prediction test")
        
        image_bytes = create_test_image(224, 224)
        result = model.predict(image_bytes)
        
        confidences = [item["confidence"] for item in result["top_3"]]
        assert confidences == sorted(confidences, reverse=True), \
            f"top_3 not sorted descending: {confidences}"


class TestLowConfidenceHandling:
    """
    Feature: vegetable-recognition-app
    Property 3: Low Confidence Handling
    
    For any prediction where the highest confidence score is below 0.5 (50%), 
    the ML_Service SHALL return "Unknown vegetable" as the predicted class.
    
    Validates: Requirements 2.4
    """
    
    def test_low_confidence_threshold_constant(self):
        """
        Property 3: Low Confidence Handling
        The low confidence threshold SHALL be set to 0.5 (50%).
        """
        assert LOW_CONFIDENCE_THRESHOLD == 0.5, \
            f"Threshold should be 0.5, got {LOW_CONFIDENCE_THRESHOLD}"
    
    def test_class_names_valid(self):
        """
        Property 3: Low Confidence Handling
        All class names SHALL be valid vegetable names from the 15 supported types.
        """
        expected_classes = {
            "Bean", "Bitter_Gourd", "Bottle_Gourd", "Brinjal", "Broccoli",
            "Cabbage", "Capsicum", "Carrot", "Cauliflower", "Cucumber",
            "Papaya", "Potato", "Pumpkin", "Radish", "Tomato"
        }
        assert set(CLASS_NAMES) == expected_classes, \
            f"Class names mismatch. Expected {expected_classes}, got {set(CLASS_NAMES)}"
        assert len(CLASS_NAMES) == 15, \
            f"Should have 15 classes, got {len(CLASS_NAMES)}"
    
    def test_predicted_class_is_valid_or_unknown(self):
        """
        Property 3: Low Confidence Handling
        For any prediction, predicted_class SHALL be either a valid class name 
        or "Unknown vegetable".
        """
        model = VegetableModel()
        model.load_model()
        
        if not model.is_loaded:
            pytest.skip("Model not loaded - skipping prediction test")
        
        image_bytes = create_test_image(224, 224)
        result = model.predict(image_bytes)
        
        valid_classes = set(CLASS_NAMES) | {"Unknown vegetable"}
        assert result["predicted_class"] in valid_classes, \
            f"Invalid predicted class: {result['predicted_class']}"
