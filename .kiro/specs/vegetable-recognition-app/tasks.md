# Implementation Plan: Vegetable Recognition App

## Overview

Implementasi aplikasi klasifikasi sayuran dengan arsitektur microservices. Dimulai dari training model, lalu ML service, API gateway, frontend, dan terakhir Docker containerization.

## Tasks

- [x] 1. Setup Project Structure
  - [x] 1.1 Create project directory structure
    - Create folders: `ml-service/`, `api-gateway/`, `frontend/`, `training/`, `docker/`
    - Initialize git repository
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Model Training Pipeline
  - [x] 2.1 Create training configuration and utilities
    - Create `training/config.py` with TrainingConfig dataclass
    - Create `training/utils.py` with helper functions
    - _Requirements: 1.1, 1.4_
  
  - [x] 2.2 Implement data loading and augmentation
    - Create `training/data_loader.py` with ImageDataGenerator
    - Implement data augmentation (rotation, flip, zoom, shift)
    - Setup train/validation/test splits
    - _Requirements: 1.4_
  
  - [x] 2.3 Build MobileNetV2 classifier model
    - Create `training/model.py` with VegetableClassifier class
    - Implement transfer learning with MobileNetV2 base
    - Add custom classification head for 15 classes
    - _Requirements: 1.1_
  
  - [x] 2.4 Implement training loop with callbacks
    - Create `training/train.py` main training script
    - Add EarlyStopping callback
    - Add ReduceLROnPlateau callback
    - Display training progress with metrics
    - _Requirements: 1.5, 1.7_
  
  - [x] 2.5 Implement evaluation and model saving
    - Generate confusion matrix visualization
    - Generate classification report
    - Save model in .h5 format
    - Save model in SavedModel format
    - _Requirements: 1.2, 1.3, 1.6_
  
  - [x] 2.6 Write unit tests for training pipeline

    - Test data loader functionality
    - Test model architecture
    - _Requirements: 1.1, 1.4_

- [x] 3. Checkpoint - Train Model
  - Run training script and verify model achieves >90% accuracy
  - Ensure model files are saved correctly
  - Ask user if questions arise

- [x] 4. ML Service (FastAPI)
  - [x] 4.1 Setup FastAPI project structure
    - Create `ml-service/requirements.txt`
    - Create `ml-service/app/main.py` with FastAPI app
    - _Requirements: 2.1_
  
  - [x] 4.2 Implement model loading and preprocessing
    - Create `ml-service/app/model.py` for model management
    - Implement image preprocessing to 224x224
    - Load saved model on startup
    - _Requirements: 2.1_
  
  - [x] 4.3 Implement prediction endpoint
    - Create POST /predict endpoint
    - Return predicted class, confidence, top-3 predictions
    - Handle low confidence (<50%) as "Unknown vegetable"
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [x] 4.4 Implement health check and error handling
    - Create GET /health endpoint
    - Add proper error responses for invalid inputs
    - Support JPEG, PNG, WebP formats
    - _Requirements: 2.5, 5.4_
  
  - [x] 4.5 Write property tests for ML Service

    - **Property 1: Image Preprocessing Consistency**
    - **Property 2: Prediction Output Completeness**
    - **Property 3: Low Confidence Handling**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 5. Checkpoint - Test ML Service
  - Run ML service locally
  - Test prediction endpoint with sample images
  - Ask user if questions arise

- [x] 6. API Gateway (Node.js/Express)
  - [x] 6.1 Setup Node.js project structure
    - Create `api-gateway/package.json`
    - Install dependencies (express, multer, axios, pg, cors)
    - Create `api-gateway/src/index.js`
    - _Requirements: 5.1, 5.3_
  
  - [x] 6.2 Setup PostgreSQL connection and schema
    - Create `api-gateway/src/db.js` for database connection
    - Create `api-gateway/src/migrations/` for schema
    - Implement auto-migration on startup
    - _Requirements: 7.6, 7.7_
  
  - [x] 6.3 Implement file upload and ML service integration
    - Create POST /api/predict endpoint
    - Handle multipart file upload with 10MB limit
    - Forward image to ML service
    - _Requirements: 5.1, 5.2_
  
  - [x] 6.4 Implement Ollama LLM integration
    - Create `api-gateway/src/llm.js` for Ollama client
    - Generate recipe recommendations in Indonesian
    - Generate nutrition info and storage tips
    - Implement 30s timeout with fallback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.5_
  
  - [x] 6.5 Implement history endpoints
    - Create GET /api/history endpoint
    - Create DELETE /api/history/:id endpoint
    - Save predictions to database
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 6.6 Implement error handling middleware
    - Add global error handler
    - Return proper HTTP status codes
    - _Requirements: 5.4_
  
  - [x] 6.7 Write property tests for API Gateway

    - **Property 4: File Size Validation**
    - **Property 5: LLM Request Timeout**
    - **Property 6: Error Response Format**
    - **Property 7: LLM Response Completeness**
    - **Property 8: Database Record Completeness**
    - **Validates: Requirements 3.2, 3.3, 3.4, 5.2, 5.4, 5.5, 7.1, 7.2**

- [x] 7. Checkpoint - Test API Gateway
  - Run API gateway with ML service
  - Test full prediction flow with LLM
  - Verify database storage
  - Ask user if questions arise

- [x] 8. Frontend (React)
  - [x] 8.1 Setup React project with Tailwind CSS
    - Create React app with Vite
    - Install and configure Tailwind CSS
    - Setup project structure
    - _Requirements: 4.1_
  
  - [x] 8.2 Implement image upload component
    - Create ImageUpload component with drag-and-drop
    - Add image preview before submission
    - Add file validation (type, size)
    - _Requirements: 4.1, 4.2_
  
  - [x] 8.3 Implement prediction result component
    - Create PredictionResult component
    - Display classification with confidence percentage
    - Show top-3 predictions
    - Add loading indicator
    - _Requirements: 4.3, 4.4_
  
  - [x] 8.4 Implement LLM recommendation component
    - Create Recommendation component
    - Display recipes in formatted cards
    - Display nutrition info
    - Display storage tips
    - _Requirements: 4.5_
  
  - [x] 8.5 Implement history page
    - Create History page component
    - Display past predictions in grid view
    - Add delete functionality
    - _Requirements: 7.5_
  
  - [x] 8.6 Implement responsive design
    - Add mobile-friendly styles
    - Test on different screen sizes
    - _Requirements: 4.6_
  
  - [x] 8.7 Create API service layer
    - Create `src/services/api.ts`
    - Implement predict, getHistory, deleteHistory functions
    - _Requirements: 5.1, 7.3, 7.4_

- [x] 9. Checkpoint - Test Frontend
  - Run frontend with backend services
  - Test full user flow
  - Verify responsive design
  - Ask user if questions arise

- [x] 10. Docker Containerization
  - [x] 10.1 Create Dockerfile for ML Service
    - Create `ml-service/Dockerfile`
    - Use Python base image
    - Copy model files
    - _Requirements: 6.1_
  
  - [x] 10.2 Create Dockerfile for API Gateway
    - Create `api-gateway/Dockerfile`
    - Use Node.js base image
    - _Requirements: 6.2_
  
  - [x] 10.3 Create Dockerfile for Frontend
    - Create `frontend/Dockerfile`
    - Multi-stage build for production
    - Use nginx for serving
    - _Requirements: 6.3_
  
  - [x] 10.4 Create docker-compose.yml
    - Create `docker-compose.yml` in root
    - Configure all services (frontend, api, ml, postgres)
    - Setup networking between services
    - Mount volumes for model files
    - Expose ports (3000, 5000, 8000)
    - _Requirements: 6.4, 6.5, 6.6, 6.7_
  
  - [x] 10.5 Create environment configuration
    - Create `.env.example` with required variables
    - Document environment setup
    - _Requirements: 6.4_

- [x] 11. Final Checkpoint - Full Integration Test
  - Run `docker-compose up`
  - Test complete application flow
  - Verify all services communicate correctly
  - Ensure all tests pass
  - Ask user if questions arise

- [x] 12. User Authentication (Frontend)
  - [x] 12.1 Create AuthContext for state management
    - Create `frontend/src/contexts/AuthContext.tsx`
    - Implement login, register, logout functions
    - Store users in localStorage
    - _Requirements: 8.1, 8.2, 8.5, 8.9_
  
  - [x] 12.2 Create Login/Register page
    - Create `frontend/src/pages/Login.tsx`
    - Implement form validation (email format, password length)
    - Handle registration with duplicate email check
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_
  
  - [x] 12.3 Create Welcome landing page
    - Create `frontend/src/pages/Welcome.tsx`
    - Add animated vegetable icons
    - Display feature highlights
    - Show different CTA based on auth status
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 12.4 Implement protected routes
    - Update `frontend/src/App.tsx` with ProtectedRoute component
    - Protect /detect and /history routes
    - Add user info and logout in navbar
    - _Requirements: 8.7, 8.8, 8.9_

## Notes

- Tasks marked with `*` are optional property-based tests
- Each checkpoint is a good stopping point to verify progress
- Training (Task 2-3) should be done first to get the model file
- Docker setup (Task 10) can be done incrementally as each service is completed
