import { useState } from 'react'
import ImageUpload from '../components/ImageUpload'
import PredictionResult from '../components/PredictionResult'
import Recommendation from '../components/Recommendation'
import { predict, PredictionResponse } from '../services/api'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelect = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await predict(file)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Klasifikasi Sayuran
        </h1>
        <p className="text-gray-600">
          Upload gambar sayuran untuk mendapatkan klasifikasi dan rekomendasi resep
        </p>
      </div>

      <ImageUpload onImageSelect={handleImageSelect} isLoading={isLoading} />

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {(isLoading || result) && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PredictionResult
            predictedClass={result?.prediction.predicted_class || ''}
            confidence={result?.prediction.confidence || 0}
            top3={result?.prediction.top_3 || []}
            isLoading={isLoading}
          />

          {result && !isLoading && (
            <Recommendation
              recipes={result.recommendation.recipes}
              nutrition={result.recommendation.nutrition}
              storageTips={result.recommendation.storageTips}
            />
          )}
        </div>
      )}
    </div>
  )
}
