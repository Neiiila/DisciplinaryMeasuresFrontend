import axios from 'axios'
import { env } from '@/shared/config/env'
import { tokenStorage } from '@/shared/lib/tokenStorage'

/**
 * One configured Axios instance for the whole app.
 *
 * Every `api/*` route on the backend except the two authentication endpoints
 * carries `[Authorize]`, so the bearer token is attached centrally here. The
 * legacy Angular services never sent an `Authorization` header at all, which
 * only went unnoticed because the legacy controllers had no `[Authorize]`
 * attribute either.
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

/**
 * Called when the API rejects the stored token. Assigned by the app shell so
 * this module stays free of router and store imports (both of which import
 * the client, directly or otherwise).
 */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear()
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)
