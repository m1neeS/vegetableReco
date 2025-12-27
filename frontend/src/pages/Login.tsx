import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type AuthMode = 'login' | 'register'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !email.includes('@')) {
      setError('Email tidak valid')
      return
    }

    if (!password) {
      setError('Password harus diisi')
      return
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Nama harus diisi')
        return
      }
      if (password.length < 6) {
        setError('Password minimal 6 karakter')
        return
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi password tidak cocok')
        return
      }

      const result = register(name.trim(), email.trim(), password)
      if (!result.success) {
        setError(result.error || 'Gagal mendaftar')
        return
      }
    } else {
      const result = login(email.trim(), password)
      if (!result.success) {
        setError(result.error || 'Gagal masuk')
        return
      }
    }

    navigate('/detect')
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥬</div>
          <h1 className="text-3xl font-bold text-gray-800">
            {mode === 'login' ? 'Masuk ke VegieRecog' : 'Daftar VegieRecog'}
          </h1>
          <p className="text-gray-500 mt-2">Kenali sayuranmu dengan AI</p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Konfirmasi Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all hover:shadow-lg mt-6"
          >
            {mode === 'login' ? '🔓 Masuk' : '📝 Daftar'}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button
              onClick={switchMode}
              className="ml-2 text-green-600 hover:text-green-700 font-medium"
            >
              {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
            </button>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
