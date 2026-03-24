import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me/')
        setUser(response.data)
        setIsAuthenticated(true)
      } catch {
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password })
    const { access, refresh, user: userData } = response.data

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('user', JSON.stringify(userData))

    setUser(userData)
    setIsAuthenticated(true)

    return userData
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      
      await api.post('/auth/logout/', { refresh })
    } catch {
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}