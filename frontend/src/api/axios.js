import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor ───────────────────────────────────
// Handles token expiry globally.
// When Django returns 401, attempt a token refresh.
// If refresh fails, clear storage and redirect to login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // _retry flag prevents infinite retry loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/refresh/`,
          { refresh }
        )

        const newAccess = response.data.access
        localStorage.setItem('access_token', newAccess)

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh failed — clear everything and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/admin/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api