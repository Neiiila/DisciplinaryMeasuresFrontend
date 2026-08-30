import axios from 'axios'
import { env } from '@/shared/config/env'
import { tokenStorage } from '@/shared/lib/tokenStorage'

/**
 * One configured axios instance for the whole app.
 *
 * The legacy Angular services never attached an `Authorization` header at
 * all (each one just built its own `HttpClient` call against a hardcoded
 * URL), so protected endpoints depended on the backend accepting the token
 * through some other channel. Here the header is attached centrally, and a
 * 401 response clears the stale token and bounces the user back to login
 * instead of leaving them stuck on a broken screen.
 */
export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
})

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export const whatsappClient = axios.create({
  baseURL: env.whatsappServiceUrl,
})
