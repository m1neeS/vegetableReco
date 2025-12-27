import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const vegetables = ['🥬', '🥕', '🥦', '🍅', '🥒', '🌽', '🍆', '🫑']

export default function Welcome() {
  const [currentVeggie, setCurrentVeggie] = useState(0)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVeggie((prev) => (prev + 1) % vegetables.length)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 flex flex-col">
      {/* Floating vegetables background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-6xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            {vegetables[i % vegetables.length]}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Logo/Icon */}
        <div className="text-8xl mb-6 animate-bounce-slow">
          {vegetables[currentVeggie]}
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 text-center drop-shadow-lg">
          VegieRecog
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-green-100 mb-2 text-center">
          Kenali Sayuranmu dengan AI
        </p>
        <p className="text-lg text-green-200 mb-12 text-center max-w-md">
          Upload foto sayuran dan dapatkan informasi lengkap beserta rekomendasi resep lezat!
        </p>

        {/* CTA Button - different based on auth status */}
        {isAuthenticated ? (
          <div className="text-center">
            <p className="text-white mb-4">Selamat datang kembali, {user?.name}! 👋</p>
            <Link
              to="/detect"
              className="group relative inline-flex items-center justify-center px-10 py-4 text-xl font-bold text-green-600 bg-white rounded-full shadow-2xl hover:shadow-green-300/50 transition-all duration-300 hover:scale-105 hover:bg-green-50"
            >
              <span className="mr-2">🔍</span>
              Mulai Deteksi
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        ) : (
          <Link
            to="/login"
            className="group relative inline-flex items-center justify-center px-10 py-4 text-xl font-bold text-green-600 bg-white rounded-full shadow-2xl hover:shadow-green-300/50 transition-all duration-300 hover:scale-105 hover:bg-green-50"
          >
            <span className="mr-2">🚀</span>
            Mulai Sekarang
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        )}

        {/* Secondary links */}
        <div className="mt-8 flex gap-6">
          {isAuthenticated && (
            <Link
              to="/history"
              className="text-white/80 hover:text-white transition flex items-center gap-2"
            >
              <span>📜</span> Riwayat
            </Link>
          )}
          <a
            href="#features"
            className="text-white/80 hover:text-white transition flex items-center gap-2"
          >
            <span>✨</span> Fitur
          </a>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="bg-white/10 backdrop-blur-sm py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Apa yang bisa VegieRecog lakukan?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🎯"
              title="Deteksi Akurat"
              description="AI canggih untuk mengenali 15 jenis sayuran dengan akurasi tinggi"
            />
            <FeatureCard
              icon="🍳"
              title="Rekomendasi Resep"
              description="Dapatkan ide resep lezat berdasarkan sayuran yang terdeteksi"
            />
            <FeatureCard
              icon="📊"
              title="Info Nutrisi"
              description="Pelajari kandungan gizi dan manfaat kesehatan sayuran"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-green-800/50 py-4 text-center text-green-200 text-sm">
        <p>© 2025 VegieRecog - Powered by FutureTheory 🌱</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/30 transition-all hover:scale-105">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-green-100 text-sm">{description}</p>
    </div>
  )
}
