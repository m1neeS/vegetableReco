import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import History from './pages/History'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const isFullScreenPage = location.pathname === '/' || location.pathname === '/login'

  return (
    <div className="min-h-screen">
      {/* Hide navbar on welcome and login pages */}
      {!isFullScreenPage && (
        <nav className="bg-green-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold">
                🥬 VegieRecog
              </Link>
              <div className="flex items-center space-x-4">
                <Link to="/detect" className="hover:text-green-200 transition">
                  Deteksi
                </Link>
                <Link to="/history" className="hover:text-green-200 transition">
                  Riwayat
                </Link>
                {isAuthenticated && user && (
                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-green-500">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm">{user.name}</span>
                    <button 
                      onClick={logout}
                      className="text-green-200 hover:text-white text-sm"
                    >
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}
      
      {isFullScreenPage ? (
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      ) : (
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/detect" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      )}
    </div>
  )
}

export default App
