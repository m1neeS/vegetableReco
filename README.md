# 🥬 Vegetable Recognition App

Aplikasi web untuk klasifikasi gambar sayuran menggunakan Deep Learning (MobileNetV2) dengan integrasi LLM untuk memberikan rekomendasi resep masakan Indonesia dan informasi nutrisi.

![Tech Stack](https://img.shields.io/badge/React-18-blue?logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-18-green?logo=node.js)
![Tech Stack](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)
![Tech Stack](https://img.shields.io/badge/TensorFlow-2.x-orange?logo=tensorflow)
![Tech Stack](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

## ✨ Fitur Utama

- 🔍 **Klasifikasi Sayuran** - Identifikasi 15 jenis sayuran dari gambar
- 🍳 **Rekomendasi Resep** - Resep masakan Indonesia dari LLM (Groq/Ollama)
- 📊 **Informasi Nutrisi** - Kalori, vitamin, dan manfaat kesehatan
- 💾 **Riwayat Prediksi** - Simpan dan lihat hasil prediksi sebelumnya
- 🔐 **Autentikasi** - Login & Register untuk pengguna
- 🌐 **Full Indonesian** - Semua rekomendasi dalam Bahasa Indonesia

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   React App  │  │  Node.js API │  │  FastAPI ML  │           │
│  │   (Frontend) │──│  (Gateway)   │──│  (Service)   │           │
│  │   Port 3000  │  │   Port 5000  │  │   Port 8000  │           │
│  └──────────────┘  └──────┬───────┘  └──────────────┘           │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  PostgreSQL  │  │  Groq API /  │  │ Model Files  │           │
│  │   Port 5432  │  │    Ollama    │  │   (Volume)   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 🥬 Sayuran yang Didukung (15 Kelas)

| English | Indonesia |
|---------|-----------|
| Bean | Buncis |
| Bitter Gourd | Pare |
| Bottle Gourd | Labu Air |
| Brinjal | Terong |
| Broccoli | Brokoli |
| Cabbage | Kol |
| Capsicum | Paprika |
| Carrot | Wortel |
| Cauliflower | Kembang Kol |
| Cucumber | Timun |
| Papaya | Pepaya |
| Potato | Kentang |
| Pumpkin | Labu Kuning |
| Radish | Lobak |
| Tomato | Tomat |

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- (Opsional) Groq API Key untuk LLM cepat - [Daftar gratis di Groq](https://console.groq.com)

### 1. Clone Repository

```bash
git clone https://github.com/username/vegetable-recognition-app.git
cd vegetable-recognition-app
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env dan tambahkan Groq API key (opsional tapi recommended)
# GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### 3. Download Model

Download model ML dari [Google Drive/Release] dan letakkan di folder `models/`:
- `best_model.h5` - Model klasifikasi sayuran

### 4. Jalankan dengan Docker

```bash
# Build dan start semua services
docker-compose up --build

# Atau jalankan di background
docker-compose up -d --build
```

### 5. Akses Aplikasi

| Service | URL | Deskripsi |
|---------|-----|-----------|
| 🌐 Frontend | http://localhost:3000 | Web interface |
| 🔌 API Gateway | http://localhost:5000 | REST API |
| 🤖 ML Service | http://localhost:8000 | Model inference |
| 🗄️ PostgreSQL | localhost:5432 | Database |

## ⚙️ Konfigurasi LLM

Aplikasi mendukung 2 provider LLM:

### Option 1: Groq API (Recommended - Cepat & Gratis)

```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

### Option 2: Ollama (Local - Butuh GPU)

```env
LLM_PROVIDER=ollama
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:1b
```

Jika menggunakan Ollama, pull model setelah container running:
```bash
docker exec -it vege-ollama ollama pull llama3.2:1b
```

## 📁 Struktur Project

```
vegetable-recognition-app/
├── frontend/           # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/ # UI Components
│   │   ├── pages/      # Pages (Welcome, Login, Home, History)
│   │   ├── contexts/   # Auth Context
│   │   └── services/   # API services
│   └── Dockerfile
├── api-gateway/        # Node.js + Express
│   ├── src/
│   │   ├── handlers/   # Route handlers
│   │   ├── llm.js      # LLM integration (Groq/Ollama)
│   │   └── db.js       # PostgreSQL connection
│   └── Dockerfile
├── ml-service/         # FastAPI + TensorFlow
│   ├── app/
│   │   ├── main.py     # API endpoints
│   │   └── model.py    # Model loading & inference
│   └── Dockerfile
├── training/           # Training pipeline
│   ├── train.py        # Main training script
│   ├── model.py        # MobileNetV2 architecture
│   └── config.py       # Training config
├── models/             # Saved model files (gitignored)
├── dataset/            # Training dataset (gitignored)
├── docker-compose.yml  # Docker orchestration
├── .env.example        # Environment template
└── README.md
```

## 🐳 Docker Commands

```bash
# Start semua services
docker-compose up -d --build

# Lihat logs
docker-compose logs -f

# Lihat logs service tertentu
docker-compose logs -f api-gateway

# Stop semua services
docker-compose down

# Stop dan hapus volumes (reset database)
docker-compose down -v

# Rebuild service tertentu
docker-compose build api-gateway
docker-compose up -d api-gateway
```

## 🧪 Testing

```bash
# ML Service tests
cd ml-service
pytest

# API Gateway tests
cd api-gateway
npm test
```

## 🔧 Development

### Training Model Baru

```bash
# Install dependencies
pip install -r requirements.txt

# Siapkan dataset di folder dataset/train, dataset/validation, dataset/test

# Jalankan training
python -m training.train
```

### Run Services Tanpa Docker

```bash
# ML Service
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# API Gateway
cd api-gateway
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

## 📋 API Endpoints

### Predict Vegetable
```http
POST /api/predict
Content-Type: multipart/form-data

file: <image_file>
```

### Get History
```http
GET /api/history?limit=10
```

### Health Check
```http
GET /api/health
```

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

MIT License - lihat [LICENSE](LICENSE) untuk detail.

## 🙏 Acknowledgments

- Dataset: [Vegetable Image Dataset](https://www.kaggle.com/datasets/misrakahmed/vegetable-image-dataset)
- Model: MobileNetV2 (Transfer Learning)
- LLM: Groq API / Ollama
