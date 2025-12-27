"""
Model Architecture Module

Contains VegetableClassifier class that builds a MobileNetV2-based
classification model with transfer learning.
"""

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import (
    Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from typing import Optional

from training.config import TrainingConfig


class VegetableClassifier:
    """
    Vegetable classification model using MobileNetV2 transfer learning.
    
    Attributes:
        config: TrainingConfig object with model parameters
        model: Compiled Keras model
        class_names: List of class names
    """
    
    def __init__(self, config: TrainingConfig):
        """
        Initialize the classifier.
        
        Args:
            config: TrainingConfig object with model parameters
        """
        self.config = config
        self.model: Optional[Model] = None
        self.class_names = config.class_names
    
    def build_model(self) -> Model:
        """
        Build MobileNetV2 model with custom classification head.
        
        Uses transfer learning with ImageNet weights. The base model
        is frozen initially, and a custom classification head is added
        for 15 vegetable classes.
        
        Returns:
            Compiled Keras Model
        """
        # Load MobileNetV2 base model with ImageNet weights
        base_model = MobileNetV2(
            weights='imagenet',
            include_top=False,
            input_shape=(*self.config.img_size, 3)
        )
        
        # Freeze base model layers for transfer learning
        base_model.trainable = False
        
        # Build custom classification head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = BatchNormalization()(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(self.config.dropout_rate)(x)
        x = BatchNormalization()(x)
        x = Dense(128, activation='relu')(x)
        x = Dropout(self.config.dropout_rate)(x)
        
        # Output layer for 15 classes
        outputs = Dense(
            self.config.num_classes,
            activation='softmax',
            name='predictions'
        )(x)
        
        # Create the model
        self.model = Model(inputs=base_model.input, outputs=outputs)
        
        # Compile the model
        self.model.compile(
            optimizer=Adam(learning_rate=self.config.learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return self.model

    
    def unfreeze_base_model(self, num_layers_to_unfreeze: int = 30) -> None:
        """
        Unfreeze top layers of base model for fine-tuning.
        
        Args:
            num_layers_to_unfreeze: Number of layers from the top to unfreeze
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first.")
        
        # Get the base model (first layer of our model)
        base_model = self.model.layers[0] if hasattr(self.model.layers[0], 'layers') else None
        
        if base_model is None:
            # Find MobileNetV2 layers
            for layer in self.model.layers:
                if 'mobilenetv2' in layer.name.lower():
                    base_model = layer
                    break
        
        if base_model is not None:
            base_model.trainable = True
            # Freeze all layers except the last num_layers_to_unfreeze
            for layer in base_model.layers[:-num_layers_to_unfreeze]:
                layer.trainable = False
            
            # Recompile with lower learning rate for fine-tuning
            self.model.compile(
                optimizer=Adam(learning_rate=self.config.learning_rate / 10),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            print(f"Unfroze top {num_layers_to_unfreeze} layers for fine-tuning")
    
    def get_model_summary(self) -> str:
        """
        Get model summary as string.
        
        Returns:
            Model summary string
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first.")
        
        summary_list = []
        self.model.summary(print_fn=lambda x: summary_list.append(x))
        return '\n'.join(summary_list)
    
    def print_model_info(self) -> None:
        """Print model architecture information."""
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first.")
        
        print("\n" + "="*60)
        print("MODEL INFORMATION")
        print("="*60)
        print(f"Input shape: {self.model.input_shape}")
        print(f"Output shape: {self.model.output_shape}")
        print(f"Number of classes: {self.config.num_classes}")
        print(f"Total parameters: {self.model.count_params():,}")
        
        trainable_count = sum(
            tf.keras.backend.count_params(w) for w in self.model.trainable_weights
        )
        non_trainable_count = sum(
            tf.keras.backend.count_params(w) for w in self.model.non_trainable_weights
        )
        
        print(f"Trainable parameters: {trainable_count:,}")
        print(f"Non-trainable parameters: {non_trainable_count:,}")
        print("="*60)
    
    def save_model(self, h5_path: str, saved_model_path: str) -> None:
        """
        Save model in both .h5 and SavedModel formats.
        
        Args:
            h5_path: Path for .h5 format
            saved_model_path: Path for SavedModel format
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first.")
        
        # Save in .h5 format
        self.model.save(h5_path)
        print(f"Model saved in .h5 format: {h5_path}")
        
        # Save in SavedModel format
        self.model.save(saved_model_path, save_format='tf')
        print(f"Model saved in SavedModel format: {saved_model_path}")
    
    @classmethod
    def load_model(cls, model_path: str, config: Optional[TrainingConfig] = None):
        """
        Load a saved model.
        
        Args:
            model_path: Path to saved model (.h5 or SavedModel directory)
            config: Optional TrainingConfig object
        
        Returns:
            VegetableClassifier instance with loaded model
        """
        if config is None:
            config = TrainingConfig()
        
        classifier = cls(config)
        classifier.model = tf.keras.models.load_model(model_path)
        
        return classifier
