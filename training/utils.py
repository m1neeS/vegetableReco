"""
Training Utilities Module

Contains helper functions for training, visualization, and model management.
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict, Any, Optional
from sklearn.metrics import confusion_matrix, classification_report
import tensorflow as tf


def set_seed(seed: int = 42) -> None:
    """Set random seed for reproducibility."""
    np.random.seed(seed)
    tf.random.set_seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)


def get_available_gpus() -> List[str]:
    """Get list of available GPU devices."""
    gpus = tf.config.list_physical_devices('GPU')
    return [gpu.name for gpu in gpus]


def configure_gpu_memory_growth() -> None:
    """Configure GPU memory growth to avoid OOM errors."""
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"GPU memory growth enabled for {len(gpus)} GPU(s)")
        except RuntimeError as e:
            print(f"GPU configuration error: {e}")


def plot_training_history(
    history: tf.keras.callbacks.History,
    save_path: Optional[str] = None
) -> None:
    """
    Plot training and validation accuracy/loss curves.
    
    Args:
        history: Keras training history object
        save_path: Optional path to save the plot
    """
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Accuracy plot
    axes[0].plot(history.history['accuracy'], label='Training Accuracy', marker='o')
    axes[0].plot(history.history['val_accuracy'], label='Validation Accuracy', marker='s')
    axes[0].set_title('Model Accuracy')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Accuracy')
    axes[0].legend(loc='lower right')
    axes[0].grid(True, alpha=0.3)
    
    # Loss plot
    axes[1].plot(history.history['loss'], label='Training Loss', marker='o')
    axes[1].plot(history.history['val_loss'], label='Validation Loss', marker='s')
    axes[1].set_title('Model Loss')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Loss')
    axes[1].legend(loc='upper right')
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Training history plot saved to {save_path}")
    
    plt.show()



def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: List[str],
    save_path: Optional[str] = None,
    figsize: tuple = (12, 10)
) -> np.ndarray:
    """
    Generate and plot confusion matrix.
    
    Args:
        y_true: True labels
        y_pred: Predicted labels
        class_names: List of class names
        save_path: Optional path to save the plot
        figsize: Figure size tuple
    
    Returns:
        Confusion matrix as numpy array
    """
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=figsize)
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=class_names,
        yticklabels=class_names
    )
    plt.title('Confusion Matrix', fontsize=14)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('True Label', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Confusion matrix saved to {save_path}")
    
    plt.show()
    
    return cm


def generate_classification_report(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: List[str],
    save_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate and optionally save classification report.
    
    Args:
        y_true: True labels
        y_pred: Predicted labels
        class_names: List of class names
        save_path: Optional path to save the report
    
    Returns:
        Classification report as dictionary
    """
    report_dict = classification_report(
        y_true, y_pred,
        target_names=class_names,
        output_dict=True
    )
    
    report_str = classification_report(
        y_true, y_pred,
        target_names=class_names
    )
    
    print("\n" + "="*60)
    print("CLASSIFICATION REPORT")
    print("="*60)
    print(report_str)
    
    if save_path:
        with open(save_path, 'w') as f:
            f.write("CLASSIFICATION REPORT\n")
            f.write("="*60 + "\n")
            f.write(report_str)
        print(f"Classification report saved to {save_path}")
    
    return report_dict


def print_training_summary(
    history: tf.keras.callbacks.History,
    test_accuracy: float,
    test_loss: float
) -> None:
    """
    Print a summary of training results.
    
    Args:
        history: Keras training history
        test_accuracy: Test set accuracy
        test_loss: Test set loss
    """
    best_val_acc = max(history.history['val_accuracy'])
    best_epoch = history.history['val_accuracy'].index(best_val_acc) + 1
    final_train_acc = history.history['accuracy'][-1]
    final_val_acc = history.history['val_accuracy'][-1]
    
    print("\n" + "="*60)
    print("TRAINING SUMMARY")
    print("="*60)
    print(f"Total Epochs Trained: {len(history.history['accuracy'])}")
    print(f"Best Validation Accuracy: {best_val_acc:.4f} (Epoch {best_epoch})")
    print(f"Final Training Accuracy: {final_train_acc:.4f}")
    print(f"Final Validation Accuracy: {final_val_acc:.4f}")
    print("-"*60)
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Test Loss: {test_loss:.4f}")
    print("="*60)


def count_dataset_images(dataset_dir: str) -> Dict[str, Dict[str, int]]:
    """
    Count images in each class for train/validation/test splits.
    
    Args:
        dataset_dir: Root directory of the dataset
    
    Returns:
        Dictionary with counts per split and class
    """
    counts = {}
    
    for split in ['train', 'validation', 'test']:
        split_dir = os.path.join(dataset_dir, split)
        if os.path.exists(split_dir):
            counts[split] = {}
            total = 0
            for class_name in sorted(os.listdir(split_dir)):
                class_dir = os.path.join(split_dir, class_name)
                if os.path.isdir(class_dir):
                    num_images = len([
                        f for f in os.listdir(class_dir)
                        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
                    ])
                    counts[split][class_name] = num_images
                    total += num_images
            counts[split]['_total'] = total
    
    return counts


def print_dataset_summary(dataset_dir: str) -> None:
    """Print summary of dataset distribution."""
    counts = count_dataset_images(dataset_dir)
    
    print("\n" + "="*60)
    print("DATASET SUMMARY")
    print("="*60)
    
    for split, class_counts in counts.items():
        total = class_counts.pop('_total', 0)
        print(f"\n{split.upper()} SET: {total} images")
        print("-"*40)
        for class_name, count in sorted(class_counts.items()):
            print(f"  {class_name}: {count}")
