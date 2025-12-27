"""
Data Loading Module

Contains functions for loading and augmenting image data for training.
Uses Keras ImageDataGenerator for data augmentation.
"""

from typing import Tuple
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from training.config import TrainingConfig


def create_data_generators(
    config: TrainingConfig
) -> Tuple[tf.keras.preprocessing.image.DirectoryIterator,
           tf.keras.preprocessing.image.DirectoryIterator,
           tf.keras.preprocessing.image.DirectoryIterator]:
    """
    Create data generators for train, validation, and test sets.
    
    Training data uses augmentation while validation and test data
    only use rescaling for normalization.
    
    Args:
        config: TrainingConfig object with augmentation parameters
    
    Returns:
        Tuple of (train_generator, validation_generator, test_generator)
    """
    # Training data generator with augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=config.rotation_range,
        width_shift_range=config.width_shift_range,
        height_shift_range=config.height_shift_range,
        shear_range=config.shear_range,
        zoom_range=config.zoom_range,
        horizontal_flip=config.horizontal_flip,
        fill_mode=config.fill_mode
    )
    
    # Validation and test data generators (only rescaling)
    val_test_datagen = ImageDataGenerator(rescale=1./255)
    
    # Create generators from directories
    train_generator = train_datagen.flow_from_directory(
        config.train_dir,
        target_size=config.img_size,
        batch_size=config.batch_size,
        class_mode='categorical',
        shuffle=True
    )
    
    validation_generator = val_test_datagen.flow_from_directory(
        config.validation_dir,
        target_size=config.img_size,
        batch_size=config.batch_size,
        class_mode='categorical',
        shuffle=False
    )
    
    test_generator = val_test_datagen.flow_from_directory(
        config.test_dir,
        target_size=config.img_size,
        batch_size=config.batch_size,
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, validation_generator, test_generator



def get_class_indices(generator: tf.keras.preprocessing.image.DirectoryIterator) -> dict:
    """
    Get class name to index mapping from a generator.
    
    Args:
        generator: Keras DirectoryIterator
    
    Returns:
        Dictionary mapping class names to indices
    """
    return generator.class_indices


def get_class_names(generator: tf.keras.preprocessing.image.DirectoryIterator) -> list:
    """
    Get ordered list of class names from a generator.
    
    Args:
        generator: Keras DirectoryIterator
    
    Returns:
        List of class names ordered by index
    """
    class_indices = generator.class_indices
    # Invert the dictionary to get index -> class_name
    index_to_class = {v: k for k, v in class_indices.items()}
    return [index_to_class[i] for i in range(len(class_indices))]


def print_generator_info(
    train_gen: tf.keras.preprocessing.image.DirectoryIterator,
    val_gen: tf.keras.preprocessing.image.DirectoryIterator,
    test_gen: tf.keras.preprocessing.image.DirectoryIterator
) -> None:
    """
    Print information about the data generators.
    
    Args:
        train_gen: Training data generator
        val_gen: Validation data generator
        test_gen: Test data generator
    """
    print("\n" + "="*60)
    print("DATA GENERATOR INFO")
    print("="*60)
    print(f"Training samples: {train_gen.samples}")
    print(f"Validation samples: {val_gen.samples}")
    print(f"Test samples: {test_gen.samples}")
    print(f"Number of classes: {train_gen.num_classes}")
    print(f"Image size: {train_gen.target_size}")
    print(f"Batch size: {train_gen.batch_size}")
    print("-"*60)
    print("Class mapping:")
    for class_name, idx in sorted(train_gen.class_indices.items(), key=lambda x: x[1]):
        print(f"  {idx}: {class_name}")
    print("="*60)


def create_inference_generator(
    image_dir: str,
    config: TrainingConfig
) -> tf.keras.preprocessing.image.DirectoryIterator:
    """
    Create a generator for inference (no augmentation).
    
    Args:
        image_dir: Directory containing images
        config: TrainingConfig object
    
    Returns:
        DirectoryIterator for inference
    """
    datagen = ImageDataGenerator(rescale=1./255)
    
    return datagen.flow_from_directory(
        image_dir,
        target_size=config.img_size,
        batch_size=config.batch_size,
        class_mode='categorical',
        shuffle=False
    )
