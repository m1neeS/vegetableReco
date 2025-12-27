# Requirements Document

## Introduction

Aplikasi web untuk klasifikasi gambar sayuran menggunakan deep learning (MobileNetV2) dengan integrasi LLM (Llama3 via Ollama) untuk memberikan rekomendasi resep dan informasi nutrisi berdasarkan sayuran yang terdeteksi. Aplikasi di-containerize menggunakan Docker untuk kemudahan deployment.

## Glossary

- **Classifier**: Model deep learning MobileNetV2 yang melakukan klasifikasi gambar sayuran
- **LLM_Service**: Layanan Ollama yang menjalankan Llama3 untuk generate rekomendasi
- **ML_Service**: Backend Python (FastAPI) yang serve model klasifikasi
- **API_Gateway**: Backend Node.js yang menghubungkan frontend dengan ML_Service dan LLM_Service
- **Web_Client**: Aplikasi React untuk user interface
- **Docker_Container**: Container untuk menjalankan semua services
- **Database**: PostgreSQL database untuk menyimpan history prediksi
- **Auth_System**: Sistem autentikasi client-side menggunakan localStorage

## Requirements

### Requirement 1: Model Training Pipeline

**User Story:** As a developer, I want to train a vegetable classification model, so that I can accurately classify 15 types of vegetables from images.

#### Acceptance Criteria

1. THE Classifier SHALL be trained using MobileNetV2 architecture with transfer learning
2. THE Classifier SHALL achieve minimum 90% accuracy on test dataset
3. WHEN training is complete, THE Training_Pipeline SHALL save the model in both .h5 and SavedModel format
4. THE Training_Pipeline SHALL implement data augmentation to improve model generalization
5. THE Training_Pipeline SHALL use callbacks for early stopping and learning rate reduction
6. WHEN training completes, THE Training_Pipeline SHALL generate confusion matrix and classification report
7. THE Training_Pipeline SHALL display training progress with accuracy and loss metrics

### Requirement 2: Image Classification

**User Story:** As a user, I want to upload a vegetable image and get accurate classification results, so that I can identify the vegetable type.

#### Acceptance Criteria

1. WHEN a user uploads an image, THE ML_Service SHALL preprocess it to 224x224 pixels
2. WHEN preprocessing is complete, THE Classifier SHALL return the predicted class and confidence score
3. THE Classifier SHALL return top-3 predictions with confidence scores
4. IF the highest confidence score is below 50%, THEN THE ML_Service SHALL return "Unknown vegetable" message
5. THE ML_Service SHALL accept images in JPEG, PNG, and WebP formats

### Requirement 3: LLM Recommendation

**User Story:** As a user, I want to receive recipe recommendations and nutritional information based on the detected vegetable, so that I can learn how to use the vegetable.

#### Acceptance Criteria

1. WHEN a vegetable is successfully classified, THE API_Gateway SHALL send the result to LLM_Service
2. THE LLM_Service SHALL generate recipe recommendations in Indonesian language
3. THE LLM_Service SHALL provide nutritional information for the detected vegetable
4. THE LLM_Service SHALL suggest storage tips for the vegetable
5. IF LLM_Service is unavailable, THEN THE API_Gateway SHALL return cached/default recommendations

### Requirement 4: Web Interface

**User Story:** As a user, I want a modern and intuitive web interface, so that I can easily upload images and view results.

#### Acceptance Criteria

1. THE Web_Client SHALL provide drag-and-drop image upload functionality
2. THE Web_Client SHALL display image preview before submission
3. WHEN classification is in progress, THE Web_Client SHALL show loading indicator
4. THE Web_Client SHALL display classification results with confidence percentage
5. THE Web_Client SHALL display LLM recommendations in formatted cards
6. THE Web_Client SHALL be responsive and work on mobile devices

### Requirement 5: API Backend

**User Story:** As a developer, I want a robust API backend, so that frontend can communicate with ML and LLM services.

#### Acceptance Criteria

1. THE API_Gateway SHALL expose POST /api/predict endpoint for image classification
2. THE API_Gateway SHALL handle file upload with size limit of 10MB
3. THE API_Gateway SHALL implement CORS for frontend communication
4. IF an error occurs, THEN THE API_Gateway SHALL return appropriate error messages with HTTP status codes
5. THE API_Gateway SHALL implement request timeout of 30 seconds for LLM calls


### Requirement 6: Docker Containerization

**User Story:** As a developer, I want all services containerized with Docker, so that deployment and development setup is easy and consistent.

#### Acceptance Criteria

1. THE Docker_Container SHALL include Dockerfile for ML_Service (Python/FastAPI)
2. THE Docker_Container SHALL include Dockerfile for API_Gateway (Node.js)
3. THE Docker_Container SHALL include Dockerfile for Web_Client (React)
4. THE Docker_Container SHALL provide docker-compose.yml to orchestrate all services
5. WHEN running docker-compose up, THE Docker_Container SHALL start all services with correct networking
6. THE Docker_Container SHALL mount volumes for model files to avoid rebuilding on model updates
7. THE Docker_Container SHALL expose appropriate ports (3000 for frontend, 5000 for API, 8000 for ML service)

### Requirement 7: Database & History

**User Story:** As a user, I want my prediction history saved, so that I can review past classifications and recommendations.

#### Acceptance Criteria

1. THE Database SHALL store prediction records including image filename, predicted class, confidence score, and timestamp
2. THE Database SHALL store LLM recommendations associated with each prediction
3. THE API_Gateway SHALL provide GET /api/history endpoint to retrieve past predictions
4. THE API_Gateway SHALL provide DELETE /api/history/:id endpoint to delete a prediction record
5. THE Web_Client SHALL display prediction history in a list/grid view
6. THE Docker_Container SHALL include PostgreSQL service in docker-compose.yml
7. WHEN the application starts, THE Database SHALL auto-migrate/create required tables

### Requirement 8: User Authentication

**User Story:** As a user, I want to register and login to the application, so that my prediction history is personalized and secure.

#### Acceptance Criteria

1. THE Web_Client SHALL provide a registration form with name, email, and password fields
2. THE Web_Client SHALL provide a login form with email and password fields
3. WHEN a user registers, THE Auth_System SHALL validate email format and password minimum 6 characters
4. WHEN a user registers with existing email, THE Auth_System SHALL reject registration with error message
5. THE Auth_System SHALL store user credentials in localStorage (client-side authentication)
6. WHEN a user logs in successfully, THE Web_Client SHALL redirect to detection page
7. THE Web_Client SHALL protect /detect and /history routes requiring authentication
8. THE Web_Client SHALL display user name and avatar in navigation bar when logged in
9. THE Web_Client SHALL provide logout functionality that clears user session

### Requirement 9: Welcome Landing Page

**User Story:** As a visitor, I want an attractive landing page, so that I understand what the application does before signing up.

#### Acceptance Criteria

1. THE Web_Client SHALL display a welcome page with animated vegetable icons
2. THE Web_Client SHALL show application name "VegieRecog" and tagline
3. THE Web_Client SHALL display feature highlights (detection, recipes, nutrition info)
4. WHEN user is not authenticated, THE Web_Client SHALL show "Mulai Sekarang" button linking to login
5. WHEN user is authenticated, THE Web_Client SHALL show "Mulai Deteksi" button linking to detection page
6. THE Web_Client SHALL display personalized greeting with user name when authenticated
