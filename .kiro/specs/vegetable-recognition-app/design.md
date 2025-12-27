# Design Document: Vegetable Recognition App

## Overview

Aplikasi web full-stack untuk klasifikasi gambar sayuran menggunakan deep learning dengan integrasi LLM untuk rekomendasi. Arsitektur menggunakan microservices yang di-containerize dengan Docker.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   React App  │  │  Node.js API │  │  FastAPI ML  │           │
│  │   (Frontend) │──│  (Gateway)   │──│  (Service)   │           │
│  │   Port 3000  │  │   Port 5000  │  │   Port 8000  │           │
│  └──────────────┘  └──────┬───────┘  └──────────────┘           │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  PostgreSQL  │  │    Ollama    │  │ Model Files  │           │
│  │   Port 5432  │  │  Port 11434  │  │   (Volume)   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture

### Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + Tailwind CSS | User interface |
| API Gateway | Node.js + Express | Request routing, file handling |
| ML Service | Python + FastAPI | Model inference |
| Database | PostgreSQL | Store prediction history |
| LLM | Ollama + Llama3 | Generate recommendations |
| Container | Docker + docker-compose | Orchestration |

### Data Flow

1. User uploads image via React frontend
2. Frontend sends image to Node.js API Gateway
3. API Gateway forwards image to FastAPI ML Service
4. ML Service preprocesses image and runs inference
5. Prediction result sent back to API Gateway
6. API Gateway sends prediction to Ollama for LLM recommendation
7. Combined result saved to PostgreSQL
8. Response returned to frontend for display

## Components and Interfaces

### 1. Training Pipeline (Python)

```python
# train.py - Training script structure
class VegetableClassifier:
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.model = None
        self.class_names = []
    
    def build_model(self) -> tf.keras.Model:
        """Build MobileNetV2 with custom classification head"""
        pass
    
    def create_data_generators(self) -> Tuple[DataGenerator, DataGenerator, DataGenerator]:
        """Create train, validation, test data generators with augmentation"""
        pass
    
    def train(self) -> History:
        """Train model with callbacks"""
        pass
    
    def evaluate(self) -> Dict[str, float]:
        """Evaluate on test set, generate confusion matrix"""
        pass
    
    def save_model(self, path: str) -> None:
        """Save model in .h5 and SavedModel format"""
        pass
```

### 2. ML Service (FastAPI)

```python
# Endpoints
POST /predict
  - Input: multipart/form-data with image file
  - Output: {
      "predicted_class": str,
      "confidence": float,
      "top_3": [{"class": str, "confidence": float}, ...]
    }

GET /health
  - Output: {"status": "healthy", "model_loaded": bool}
```

### 3. API Gateway (Node.js/Express)

```typescript
// Endpoints
POST /api/predict
  - Input: multipart/form-data with image
  - Process: Forward to ML Service, get LLM recommendation, save to DB
  - Output: {
      "prediction": {...},
      "recommendation": {
        "recipes": [...],
        "nutrition": {...},
        "storage_tips": str
      },
      "id": uuid
    }

GET /api/history
  - Output: [{ id, image_url, prediction, recommendation, created_at }, ...]

DELETE /api/history/:id
  - Output: { "success": true }
```

### 4. Frontend (React)

```
src/
├── components/
│   ├── ImageUpload.tsx      # Drag-drop upload
│   ├── PredictionResult.tsx # Display classification
│   ├── Recommendation.tsx   # Display LLM response
│   └── History.tsx          # Prediction history
├── contexts/
│   └── AuthContext.tsx      # Authentication state management
├── pages/
│   ├── Welcome.tsx          # Landing page
│   ├── Login.tsx            # Login/Register page
│   ├── Home.tsx             # Main prediction page
│   └── History.tsx          # History page
├── services/
│   └── api.ts               # API client
└── App.tsx                  # Routes with protected routes
```

### 5. Authentication System (Client-Side)

```typescript
// AuthContext - State management
interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (name: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

// Storage keys
- vegierecog_users: StoredUser[]     // All registered users
- vegierecog_current_user: User      // Currently logged in user
```

## Data Models

### PostgreSQL Schema

```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_filename VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    predicted_class VARCHAR(100) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    top_3_predictions JSONB NOT NULL,
    llm_recommendation JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);
```

### TypeScript Interfaces

```typescript
interface Prediction {
  id: string;
  imageFilename: string;
  imagePath: string;
  predictedClass: string;
  confidence: number;
  top3Predictions: {
    class: string;
    confidence: number;
  }[];
  llmRecommendation: {
    recipes: string[];
    nutrition: {
      calories: string;
      vitamins: string[];
      benefits: string[];
    };
    storageTips: string;
  };
  createdAt: Date;
}
```

### Training Configuration

```python
@dataclass
class TrainingConfig:
    img_size: Tuple[int, int] = (224, 224)
    batch_size: int = 32
    epochs: int = 30
    learning_rate: float = 0.0003
    num_classes: int = 15
    dataset_dir: str = "dataset"
    model_save_path: str = "models/"
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Image Preprocessing Consistency

*For any* valid image input (JPEG, PNG, WebP), the ML_Service SHALL preprocess it to exactly 224x224 pixels before inference.

**Validates: Requirements 2.1, 2.5**

### Property 2: Prediction Output Completeness

*For any* valid preprocessed image, the Classifier SHALL return a response containing: predicted class (string), confidence score (0-1), and exactly 3 top predictions each with class and confidence.

**Validates: Requirements 2.2, 2.3**

### Property 3: Low Confidence Handling

*For any* prediction where the highest confidence score is below 0.5 (50%), the ML_Service SHALL return "Unknown vegetable" as the predicted class.

**Validates: Requirements 2.4**

### Property 4: File Size Validation

*For any* uploaded file exceeding 10MB, the API_Gateway SHALL reject the request with HTTP 413 status code.

**Validates: Requirements 5.2**

### Property 5: LLM Request Timeout

*For any* LLM request that exceeds 30 seconds, the API_Gateway SHALL timeout and return fallback recommendations.

**Validates: Requirements 5.5**

### Property 5: LLM Request Timeout

*For any* LLM request that exceeds 30 seconds, the API_Gateway SHALL timeout and return fallback recommendations.

**Validates: Requirements 5.5**

### Property 6: Error Response Format

*For any* error condition in the API_Gateway, the response SHALL include an appropriate HTTP status code (4xx or 5xx) and a JSON body with error message.

**Validates: Requirements 5.4**

### Property 7: LLM Response Completeness

*For any* successfully classified vegetable, the LLM_Service response SHALL contain: recipe recommendations (array), nutritional information (object), and storage tips (string), all in Indonesian language.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 8: Database Record Completeness

*For any* saved prediction, the database record SHALL contain: id, image_filename, image_path, predicted_class, confidence, top_3_predictions, llm_recommendation (if available), and created_at timestamp.

**Validates: Requirements 7.1, 7.2**

### Property 9: Authentication Validation

*For any* registration attempt, the Auth_System SHALL validate that email contains '@' character and password has minimum 6 characters before creating user.

**Validates: Requirements 8.3**

### Property 10: Protected Route Access

*For any* unauthenticated user attempting to access /detect or /history routes, the Web_Client SHALL redirect to /login page.

**Validates: Requirements 8.7**

## Error Handling

### ML Service Errors

| Error | HTTP Code | Response |
|-------|-----------|----------|
| Invalid image format | 400 | `{"error": "Unsupported image format"}` |
| Image too large | 413 | `{"error": "File size exceeds 10MB limit"}` |
| Model not loaded | 503 | `{"error": "Model not available"}` |
| Inference failed | 500 | `{"error": "Prediction failed"}` |

### API Gateway Errors

| Error | HTTP Code | Response |
|-------|-----------|----------|
| No file uploaded | 400 | `{"error": "No image file provided"}` |
| ML Service unavailable | 502 | `{"error": "ML service unavailable"}` |
| LLM timeout | 504 | `{"error": "LLM request timeout"}` + fallback |
| Database error | 500 | `{"error": "Database operation failed"}` |

### Fallback Strategy

When LLM is unavailable, return cached/default recommendations:
```json
{
  "recipes": ["Rekomendasi tidak tersedia saat ini"],
  "nutrition": {"info": "Informasi nutrisi tidak tersedia"},
  "storageTips": "Simpan di tempat sejuk dan kering"
}
```

## Testing Strategy

### Unit Tests

- **ML Service**: Test preprocessing, model loading, inference
- **API Gateway**: Test endpoint handlers, validation, error handling
- **Frontend**: Test component rendering, user interactions

### Property-Based Tests

Using Hypothesis (Python) and fast-check (TypeScript):

1. **Image preprocessing property**: Generate random valid images, verify output dimensions
2. **Prediction output property**: Verify response structure for any valid input
3. **File size validation property**: Generate files of various sizes, verify rejection threshold
4. **Error response property**: Trigger various errors, verify response format

### Integration Tests

- End-to-end prediction flow
- Database CRUD operations
- LLM integration with fallback

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: `Feature: vegetable-recognition-app, Property N: {description}`
