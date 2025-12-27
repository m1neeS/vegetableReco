"""
Unit tests for the vegetable classification training pipeline.

Tests data loader functionality and model architecture.
Requirements: 1.1, 1.4
"""

import os
import sys
import unittest
import tempfile
import shutil
import numpy as np
from PIL import Image

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import tensorflow as tf
from training.config import TrainingConfig
from training.model import VegetableClassifier
from training.data_loader import (
    get_class_indices,
    get_class_names,
)


class TestTrainingConfig(unittest.TestCase):
    """Test TrainingConfig dataclass."""
    
    def test_default_config_values(self):
        """Test that default config values are set correctly."""
        config = TrainingConfig()
        
        self.assertEqual(config.img_size, (224, 224))
        self.assertEqual(config.batch_size, 32)
        self.assertEqual(config.epochs, 30)
        self.assertEqual(config.learning_rate, 0.0003)
        self.assertEqual(config.num_classes, 15)
        self.assertEqual(config.dropout_rate, 0.3)
    
    def test_class_names_count(self):
        """Test that 15 vegetable classes are defined."""
        config = TrainingConfig()
        
        self.assertEqual(len(config.class_names), 15)
        self.assertIn("Bean", config.class_names)
        self.assertIn("Tomato", config.class_names)
        self.assertIn("Carrot", config.class_names)
    
    def test_augmentation_settings(self):
        """Test data augmentation settings are configured."""
        config = TrainingConfig()
        
        self.assertEqual(config.rotation_range, 30)
        self.assertEqual(config.width_shift_range, 0.2)
        self.assertEqual(config.height_shift_range, 0.2)
        self.assertTrue(config.horizontal_flip)
    
    def test_path_properties(self):
        """Test path property methods."""
        config = TrainingConfig(dataset_dir="test_dataset")
        
        self.assertEqual(config.train_dir, os.path.join("test_dataset", "train"))
        self.assertEqual(config.validation_dir, os.path.join("test_dataset", "validation"))
        self.assertEqual(config.test_dir, os.path.join("test_dataset", "test"))


class TestVegetableClassifier(unittest.TestCase):
    """Test VegetableClassifier model architecture."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        cls.config = TrainingConfig()
        cls.classifier = VegetableClassifier(cls.config)
    
    def test_model_build(self):
        """Test that model builds successfully with MobileNetV2."""
        model = self.classifier.build_model()
        
        self.assertIsNotNone(model)
        self.assertIsInstance(model, tf.keras.Model)
    
    def test_model_input_shape(self):
        """Test model input shape matches config (224x224x3)."""
        if self.classifier.model is None:
            self.classifier.build_model()
        
        expected_shape = (None, 224, 224, 3)
        self.assertEqual(self.classifier.model.input_shape, expected_shape)
    
    def test_model_output_shape(self):
        """Test model output shape matches 15 classes."""
        if self.classifier.model is None:
            self.classifier.build_model()
        
        expected_shape = (None, 15)
        self.assertEqual(self.classifier.model.output_shape, expected_shape)
    
    def test_model_output_activation(self):
        """Test that output layer uses softmax activation."""
        if self.classifier.model is None:
            self.classifier.build_model()
        
        output_layer = self.classifier.model.layers[-1]
        self.assertEqual(output_layer.activation.__name__, 'softmax')
    
    def test_model_compilation(self):
        """Test model is compiled with correct optimizer and loss."""
        if self.classifier.model is None:
            self.classifier.build_model()
        
        self.assertIsNotNone(self.classifier.model.optimizer)
        self.assertEqual(self.classifier.model.loss, 'categorical_crossentropy')
    
    def test_model_prediction_shape(self):
        """Test model prediction output shape."""
        if self.classifier.model is None:
            self.classifier.build_model()
        
        # Create dummy input
        dummy_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
        prediction = self.classifier.model.predict(dummy_input, verbose=0)
        
        self.assertEqual(prediction.shape, (1, 15))
    
    def test_prediction_probabilities_sum_to_one(self):
        """Test that softmax predictions sum to 1."""
        if self.classifier.model is None:
            self.classifier.build_model()
        
        dummy_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
        prediction = self.classifier.model.predict(dummy_input, verbose=0)
        
        self.assertAlmostEqual(np.sum(prediction), 1.0, places=5)
    
    def test_model_not_built_error(self):
        """Test error when accessing model before building."""
        new_classifier = VegetableClassifier(self.config)
        
        with self.assertRaises(ValueError):
            new_classifier.get_model_summary()


class TestDataLoaderHelpers(unittest.TestCase):
    """Test data loader helper functions."""
    
    @classmethod
    def setUpClass(cls):
        """Create temporary dataset structure for testing."""
        cls.temp_dir = tempfile.mkdtemp()
        cls.config = TrainingConfig(dataset_dir=cls.temp_dir)
        
        # Create minimal dataset structure
        for split in ['train', 'validation', 'test']:
            for class_name in ['Bean', 'Carrot']:
                class_dir = os.path.join(cls.temp_dir, split, class_name)
                os.makedirs(class_dir, exist_ok=True)
                
                # Create dummy images
                for i in range(3):
                    img = Image.new('RGB', (224, 224), color='green')
                    img.save(os.path.join(class_dir, f'img_{i}.jpg'))
    
    @classmethod
    def tearDownClass(cls):
        """Clean up temporary directory."""
        shutil.rmtree(cls.temp_dir)
    
    def test_get_class_indices(self):
        """Test class indices extraction from generator."""
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
        
        datagen = ImageDataGenerator(rescale=1./255)
        generator = datagen.flow_from_directory(
            self.config.train_dir,
            target_size=self.config.img_size,
            batch_size=1,
            class_mode='categorical'
        )
        
        indices = get_class_indices(generator)
        
        self.assertIsInstance(indices, dict)
        self.assertIn('Bean', indices)
        self.assertIn('Carrot', indices)
    
    def test_get_class_names(self):
        """Test class names extraction from generator."""
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
        
        datagen = ImageDataGenerator(rescale=1./255)
        generator = datagen.flow_from_directory(
            self.config.train_dir,
            target_size=self.config.img_size,
            batch_size=1,
            class_mode='categorical'
        )
        
        names = get_class_names(generator)
        
        self.assertIsInstance(names, list)
        self.assertEqual(len(names), 2)
        self.assertIn('Bean', names)
        self.assertIn('Carrot', names)


class TestModelTransferLearning(unittest.TestCase):
    """Test transfer learning functionality."""
    
    def test_base_model_frozen(self):
        """Test that MobileNetV2 base layers are frozen initially."""
        config = TrainingConfig()
        classifier = VegetableClassifier(config)
        model = classifier.build_model()
        
        # Count trainable vs non-trainable params
        trainable_count = sum(
            tf.keras.backend.count_params(w) for w in model.trainable_weights
        )
        non_trainable_count = sum(
            tf.keras.backend.count_params(w) for w in model.non_trainable_weights
        )
        
        # Base model should be frozen, so non-trainable > trainable
        self.assertGreater(non_trainable_count, trainable_count)


if __name__ == '__main__':
    unittest.main()
