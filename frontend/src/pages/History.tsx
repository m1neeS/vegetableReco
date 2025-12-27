import { useState, useEffect } from 'react'
import { getHistory, deleteHistory, PredictionHistory } from '../services/api'
import { getIndonesianName } from '../utils/vegetableNames'

export default function History() {
  const [history, setHistory] = useState<PredictionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await getHistory()
      setHistory(data)
      setError(null)
    } catch (err) {
      setError('Gagal memuat history')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus prediksi ini?')) return
    
    try {
      await deleteHistory(id)
      setHistory(history.filter(h => h.id !== id))
    } catch (err) {
      setError('Gagal menghapus')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <p className="text-gray-600">Memuat history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadHistory}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-600">Belum ada history prediksi</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">History Prediksi</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-lg font-semibold text-green-700">
                    {getIndonesianName(item.predictedClass)}
                  </span>
                  <p className="text-xs text-gray-400">
                    ({item.predictedClass.replace(/_/g, ' ')})
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {(item.confidence * 100).toFixed(1)}%
                </span>
              </div>
              
              <p className="text-xs text-gray-400 mb-2">
                {item.imageFilename}
              </p>
              
              <p className="text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleString('id-ID')}
              </p>
              
              <button
                onClick={() => handleDelete(item.id)}
                className="mt-3 text-sm text-red-500 hover:text-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
