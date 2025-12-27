"""
Training Configuration Module

Contains TrainingConfig dataclass with all hyperparameters and paths
for the vegetable classification model training.
"""

from dataclasses import dataclass, field
from typing import Tuple, List
import os


@dataclass
class TrainingConfig:
    """Configuration for vegetable classification model training."""
    
    # Image settings
    img_size: Tuple[int, int] = (224, 224)
    
    # Training hyperparameters
    batch_size: int = 32
    epochs: int = 30
    learning_rate: float = 0.0003
    
    # Model settings
    num_classes: int = 15
    dropout_rate: float = 0.3
    
    # Paths
    dataset_dir: str = "dataset"
    model_save_path: str = "models/"
    
    # Data augmentation settings
    rotation_range: int = 30
    width_shift_range: float = 0.2
    height_shift_range: float = 0.2
    shear_range: float = 0.2
    zoom_range: float = 0.2
    horizontal_flip: bool = True
    fill_mode: str = "nearest"
    
    # Callbacks settings
    early_stopping_patience: int = 5
    reduce_lr_patience: int = 3
    reduce_lr_factor: float = 0.5
    min_lr: float = 1e-7
    
    # Class names for 15 vegetable types
    class_names: List[str] = field(default_factory=lambda: [
        "Bean", "Bitter_Gourd", "Bottle_Gourd", "Brinjal", "Broccoli",
        "Cabbage", "Capsicum", "Carrot", "Cauliflower", "Cucumber",
        "Papaya", "Potato", "Pumpkin", "Radish", "Tomato"
    ])
    
    def __post_init__(self):
        """Create model save directory if it doesn't exist."""
        os.makedirs(self.model_save_path, exist_ok=True)
    
    @property
    def train_dir(self) -> str:
        """Path to training data directory."""
        return os.path.join(self.dataset_dir, "train")
    
    @property
    def validation_dir(self) -> str:
        """Path to validation data directory."""
        return os.path.join(self.dataset_dir, "validation")
    
    @property
    def test_dir(self) -> str:
        """Path to test data directory."""
        return os.path.join(self.dataset_dir, "test")
    
    @property
    def h5_model_path(self) -> str:
        """Path for saving model in .h5 format."""
        return os.path.join(self.model_save_path, "vegetable_classifier.h5")
    
    @property
    def saved_model_path(self) -> str:
        """Path for saving model in SavedModel format."""
        return os.path.join(self.model_save_path, "vegetable_classifier_saved")
