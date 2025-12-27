"""
Model Evaluation Script

Standalone script for evaluating a trained model on the test set.
Generates confusion matrix, classification report, and saves results.
"""

import os
import sys
import numpy as np
import argparse
import tensorflow as tf

from training.config import TrainingConfig
from training.data_loader import create_data_generators, get_class_names
from training.model import VegetableClassifier
from training.utils import (
    plot_confusion_matrix, generate_classification_report,
    configure_gpu_memory_growth
)


def evaluate_saved_model(
    model_path: str,
    output_dir: str = "evaluation_results"
) -> dict:
    """
    Evaluate a saved model and generate reports.
    
    Args:
        model_path: Path to saved model (.h5 or SavedModel directory)
        output_dir: Directory to save evaluation results
    
    Returns:
        Dictionary with evaluation metrics
    """
    # Configure GPU
    configure_gpu_memory_growth()
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Load configuration
    config = TrainingConfig()
    
    # Create test data generator
    print("Loading test data...")
    _, _, test_gen = create_data_generators(config)
    class_names = get_class_names(test_gen)
    
    # Load model
    print(f"Loading model from {model_path}...")
    classifier = VegetableClassifier.load_model(model_path, config)
    
    # Evaluate on test set
    print("\nEvaluating model...")
    test_loss, test_accuracy = classifier.model.evaluate(test_gen, verbose=1)
    
    print(f"\nTest Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    
    # Get predictions
    test_gen.reset()
    predictions = classifier.model.predict(test_gen, verbose=1)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    
    # Generate confusion matrix
    cm_path = os.path.join(output_dir, 'confusion_matrix.png')
    cm = plot_confusion_matrix(y_true, y_pred, class_names, save_path=cm_path)
    
    # Generate classification report
    report_path = os.path.join(output_dir, 'classification_report.txt')
    report = generate_classification_report(
        y_true, y_pred, class_names, save_path=report_path
    )
    
    # Calculate per-class accuracy
    per_class_accuracy = {}
    for i, class_name in enumerate(class_names):
        class_mask = y_true == i
        if class_mask.sum() > 0:
            class_acc = (y_pred[class_mask] == i).mean()
            per_class_accuracy[class_name] = class_acc
    
    # Print per-class accuracy
    print("\n" + "="*60)
    print("PER-CLASS ACCURACY")
    print("="*60)
    for class_name, acc in sorted(per_class_accuracy.items(), key=lambda x: x[1], reverse=True):
        print(f"  {class_name}: {acc:.4f}")
    
    results = {
        'test_loss': test_loss,
        'test_accuracy': test_accuracy,
        'per_class_accuracy': per_class_accuracy,
        'classification_report': report,
        'confusion_matrix': cm
    }
    
    # Check accuracy requirement
    print("\n" + "="*60)
    if test_accuracy >= 0.90:
        print("✓ Model meets accuracy requirement (>90%)")
    else:
        print(f"⚠ Model accuracy ({test_accuracy:.2%}) is below 90% requirement")
    print("="*60)
    
    return results


def main():
    """Main evaluation function."""
    parser = argparse.ArgumentParser(description='Evaluate vegetable classifier model')
    parser.add_argument(
        '--model', '-m',
        type=str,
        default='models/vegetable_classifier.h5',
        help='Path to saved model'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='evaluation_results',
        help='Output directory for results'
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.model):
        print(f"Error: Model not found at {args.model}")
        sys.exit(1)
    
    results = evaluate_saved_model(args.model, args.output)
    
    print(f"\nResults saved to: {args.output}")


if __name__ == "__main__":
    main()
