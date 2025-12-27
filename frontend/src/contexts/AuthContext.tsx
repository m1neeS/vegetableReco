import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface StoredUser extends User {
  password: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (name: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper functions for local storage "database"
const getUsers = (): StoredUser[] => {
  const users = localStorage.getItem('vegierecog_users')
  return users ? JSON.parse(users) : []
}

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem('vegierecog_users', JSON.stringify(users))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check localStorage on mount for logged in user
    const savedUser = localStorage.getItem('vegierecog_current_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const register = (name: string, email: string, password: string): { success: boolean; error?: string } => {
    const users = getUsers()
    
    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email sudah terdaftar' }
    }

    // Validate password
    if (password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter' }
    }

    // Create new user
    const newUser: StoredUser = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password, // In production, this should be hashed!
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=22c55e&color=fff`
    }

    users.push(newUser)
    saveUsers(users)

    // Auto login after register
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem('vegierecog_current_user', JSON.stringify(userWithoutPassword))

    return { success: true }
  }

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const users = getUsers()
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!foundUser) {
      return { success: false, error: 'Email tidak ditemukan' }
    }

    if (foundUser.password !== password) {
      return { success: false, error: 'Password salah' }
    }

    const { password: _, ...userWithoutPassword } = foundUser
    setUser(userWithoutPassword)
    localStorage.setItem('vegierecog_current_user', JSON.stringify(userWithoutPassword))

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('vegierecog_current_user')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
