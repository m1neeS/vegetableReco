import { useState, useCallback, DragEvent, ChangeEvent } from 'react'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  isLoading: boolean
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default function ImageUpload({ onImageSelect, isLoading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Format tidak didukung. Gunakan JPEG, PNG, atau WebP.'
    }
    if (file.size > MAX_SIZE) {
      return 'Ukuran file melebihi 10MB.'
    }
    return null
  }

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    onImageSelect(file)
  }, [onImageSelect])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const clearPreview = () => {
    setPreview(null)
    setError(null)
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <button
              onClick={clearPreview}
              className="text-sm text-gray-500 hover:text-red-500 transition"
              disabled={isLoading}
            >
              Hapus gambar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📷</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drag & drop gambar sayuran di sini
              </p>
              <p className="text-sm text-gray-500 mt-1">
                atau klik untuk memilih file
              </p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChange}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition"
            >
              Pilih Gambar
            </label>
            <p className="text-xs text-gray-400">
              JPEG, PNG, WebP • Maks 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
