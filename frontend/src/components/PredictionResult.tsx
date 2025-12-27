import { getIndonesianName } from '../utils/vegetableNames'

interface Top3Prediction {
  class: string
  confidence: number
}

interface PredictionResultProps {
  predictedClass: string
  confidence: number
  top3: Top3Prediction[]
  isLoading: boolean
}

export default function PredictionResult({ 
  predictedClass, 
  confidence, 
  top3, 
  isLoading 
}: PredictionResultProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <p className="text-gray-600">Menganalisis gambar...</p>
      </div>
    )
  }

  if (!predictedClass) return null

  const confidencePercent = (confidence * 100).toFixed(1)
  const isUnknown = predictedClass === 'Unknown vegetable'
  const displayName = getIndonesianName(predictedClass)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Hasil Klasifikasi
      </h3>

      <div className={`p-4 rounded-lg mb-4 ${isUnknown ? 'bg-yellow-50' : 'bg-green-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Terdeteksi sebagai</p>
            <p className={`text-2xl font-bold ${isUnknown ? 'text-yellow-700' : 'text-green-700'}`}>
              {displayName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ({predictedClass.replace(/_/g, ' ')})
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Confidence</p>
            <p className={`text-2xl font-bold ${isUnknown ? 'text-yellow-700' : 'text-green-700'}`}>
              {confidencePercent}%
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isUnknown ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">Top 3 Prediksi:</p>
        <div className="space-y-2">
          {top3.map((pred, idx) => (
            <div
              key={pred.class}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">#{idx + 1}</span>
                <span className="text-gray-700">{getIndonesianName(pred.class)}</span>
                <span className="text-xs text-gray-400">({pred.class.replace(/_/g, ' ')})</span>
              </div>
              <span className="text-sm text-gray-500">
                {(pred.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
