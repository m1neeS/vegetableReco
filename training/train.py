"""
Main Training Script

Orchestrates the complete training pipeline for vegetable classification.
Includes callbacks for early stopping and learning rate reduction.
"""

import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard
)
from datetime import datetime
from typing import List, Tuple

from training.config import TrainingConfig
from training.data_loader import (
    create_data_generators, get_class_names, print_generator_info
)
from training.model import VegetableClassifier
from training.utils import (
    set_seed, configure_gpu_memory_growth, plot_training_history,
    plot_confusion_matrix, generate_classification_report,
    print_training_summary, print_dataset_summary
)


def create_callbacks(config: TrainingConfig) -> List[tf.keras.callbacks.Callback]:
    """
    Create training callbacks.
    
    Args:
        config: TrainingConfig object
    
    Returns:
        List of Keras callbacks
    """
    callbacks = []
    
    # Early stopping to prevent overfitting
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=config.early_stopping_patience,
        restore_best_weights=True,
        verbose=1
    )
    callbacks.append(early_stopping)
    
    # Reduce learning rate when validation loss plateaus
    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=config.reduce_lr_factor,
        patience=config.reduce_lr_patience,
        min_lr=config.min_lr,
        verbose=1
    )
    callbacks.append(reduce_lr)
    
    # Model checkpoint to save best model
    checkpoint_path = os.path.join(config.model_save_path, 'best_model.h5')
    checkpoint = ModelCheckpoint(
        checkpoint_path,
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    )
    callbacks.append(checkpoint)
    
    return callbacks



def train_model(
    classifier: VegetableClassifier,
    train_generator,
    validation_generator,
    config: TrainingConfig
) -> tf.keras.callbacks.History:
    """
    Train the model with callbacks.
    
    Args:
        classifier: VegetableClassifier instance
        train_generator: Training data generator
        validation_generator: Validation data generator
        config: TrainingConfig object
    
    Returns:
        Training history
    """
    callbacks = create_callbacks(config)
    
    print("\n" + "="*60)
    print("STARTING TRAINING")
    print("="*60)
    print(f"Epochs: {config.epochs}")
    print(f"Batch size: {config.batch_size}")
    print(f"Learning rate: {config.learning_rate}")
    print(f"Early stopping patience: {config.early_stopping_patience}")
    print("="*60 + "\n")
    
    history = classifier.model.fit(
        train_generator,
        epochs=config.epochs,
        validation_data=validation_generator,
        callbacks=callbacks,
        verbose=1
    )
    
    return history


def evaluate_model(
    classifier: VegetableClassifier,
    test_generator,
    config: TrainingConfig
) -> Tuple[float, float, np.ndarray, np.ndarray]:
    """
    Evaluate model on test set.
    
    Args:
        classifier: VegetableClassifier instance
        test_generator: Test data generator
        config: TrainingConfig object
    
    Returns:
        Tuple of (test_loss, test_accuracy, y_true, y_pred)
    """
    print("\n" + "="*60)
    print("EVALUATING MODEL")
    print("="*60)
    
    # Evaluate on test set
    test_loss, test_accuracy = classifier.model.evaluate(
        test_generator, verbose=1
    )
    
    print(f"\nTest Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    
    # Get predictions for confusion matrix
    test_generator.reset()
    predictions = classifier.model.predict(test_generator, verbose=1)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_generator.classes
    
    return test_loss, test_accuracy, y_true, y_pred


def main():
    """Main training pipeline."""
    # Set random seed for reproducibility
    set_seed(42)
    
    # Configure GPU
    configure_gpu_memory_growth()
    
    # Initialize configuration
    config = TrainingConfig()
    
    # Print dataset summary
    print_dataset_summary(config.dataset_dir)
    
    # Create data generators
    print("\nCreating data generators...")
    train_gen, val_gen, test_gen = create_data_generators(config)
    print_generator_info(train_gen, val_gen, test_gen)
    
    # Get class names from generator
    class_names = get_class_names(train_gen)
    config.class_names = class_names
    
    # Build model
    print("\nBuilding model...")
    classifier = VegetableClassifier(config)
    classifier.build_model()
    classifier.print_model_info()
    
    # Train model
    history = train_model(classifier, train_gen, val_gen, config)
    
    # Evaluate model
    test_loss, test_accuracy, y_true, y_pred = evaluate_model(
        classifier, test_gen, config
    )
    
    # Print training summary
    print_training_summary(history, test_accuracy, test_loss)
    
    # Check if accuracy meets requirement (>90%)
    if test_accuracy >= 0.90:
        print("\n✓ Model meets accuracy requirement (>90%)")
    else:
        print(f"\n⚠ Model accuracy ({test_accuracy:.2%}) is below 90% requirement")
    
    # Generate visualizations
    print("\nGenerating visualizations...")
    
    # Plot training history
    history_plot_path = os.path.join(config.model_save_path, 'training_history.png')
    plot_training_history(history, save_path=history_plot_path)
    
    # Plot confusion matrix
    cm_plot_path = os.path.join(config.model_save_path, 'confusion_matrix.png')
    plot_confusion_matrix(y_true, y_pred, class_names, save_path=cm_plot_path)
    
    # Generate classification report
    report_path = os.path.join(config.model_save_path, 'classification_report.txt')
    generate_classification_report(y_true, y_pred, class_names, save_path=report_path)
    
    # Save model in both formats
    print("\nSaving model...")
    classifier.save_model(config.h5_model_path, config.saved_model_path)
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE")
    print("="*60)
    print(f"Model saved to: {config.model_save_path}")
    print("="*60)


if __name__ == "__main__":
    main()
