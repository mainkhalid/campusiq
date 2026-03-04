import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // On app load — check if tokens exist and validate them
  // by calling /api/auth/me/ with the stored access token.
  // This replaces your old hardcoded credential check.
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Verify token is still valid by hitting /me/
        // The axios interceptor attaches the token automatically
        const response = await api.get('/auth/me/')
        setUser(response.data)
        setIsAuthenticated(true)
      } catch {
        // Token invalid or expired and refresh also failed
        // interceptor already cleared localStorage
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    // Called by Login.jsx — same signature as before
    const response = await api.post('/auth/login/', { email, password })
    const { access, refresh, user: userData } = response.data

    // Store tokens in localStorage
    // access token — short lived (8 hours per your settings)
    // refresh token — longer lived (7 days per your settings)
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
      // Blacklist the refresh token on the server
      await api.post('/auth/logout/', { refresh })
    } catch {
      // Logout locally even if server call fails
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
      {/* Don't render children until auth state is known
          prevents flash of login page for authenticated users */}
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