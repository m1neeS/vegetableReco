"""
ML Service - FastAPI application for vegetable classification.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .model import VegetableModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model instance
model: VegetableModel = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup."""
    global model
    logger.info("Loading vegetable classification model...")
    model = VegetableModel()
    model.load_model()
    logger.info("Model loaded successfully")
    yield
    logger.info("Shutting down ML service")


app = FastAPI(
    title="Vegetable Classification ML Service",
    description="API for classifying vegetable images using MobileNetV2",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model is not None and model.is_loaded
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict vegetable class from uploaded image.
    
    Accepts JPEG, PNG, and WebP formats.
    Returns predicted class, confidence, and top-3 predictions.
    """
    # Validate model is loaded
    if model is None or not model.is_loaded:
        raise HTTPException(status_code=503, detail="Model not available")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format. Allowed: JPEG, PNG, WebP"
        )
    
    # Read file content
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read image file")
    
    # Validate file size (10MB limit)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")
    
    # Run prediction
    try:
        result = model.predict(contents)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")
