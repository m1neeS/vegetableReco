import axios from 'axios'

const API_BASE = '/api'

export interface Top3Prediction {
  class: string
  confidence: number
}

export interface Prediction {
  predicted_class: string
  confidence: number
  top_3: Top3Prediction[]
}

export interface Recommendation {
  recipes: string[]
  nutrition: {
    calories?: string
    vitamins?: string[]
    benefits?: string[]
    info?: string
  }
  storageTips: string
}

export interface PredictionResponse {
  id: string
  prediction: Prediction
  recommendation: Recommendation
  created_at: string
}

export interface PredictionHistory {
  id: string
  imageFilename: string
  imagePath: string
  predictedClass: string
  confidence: number
  top3Predictions: Top3Prediction[]
  llmRecommendation: Recommendation
  createdAt: string
}

/**
 * Upload image and get prediction with recommendations
 */
export async function predict(file: File): Promise<PredictionResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post<PredictionResponse>(
    `${API_BASE}/predict`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    }
  )

  return response.data
}

/**
 * Get prediction history
 */
export async function getHistory(limit = 50): Promise<PredictionHistory[]> {
  const response = await axios.get<PredictionHistory[]>(
    `${API_BASE}/history`,
    { params: { limit } }
  )
  return response.data
}

/**
 * Delete prediction from history
 */
export async function deleteHistory(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/history/${id}`)
}
