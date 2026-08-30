import { httpClient } from '@/shared/api/httpClient'
import type { LoginCredentials, LoginResponse, RegisterPayload } from '@/features/auth/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Data-access layer for authentication. Components never call `httpClient`
 * directly; they go through repositories like this one, which is the same
 * repository pattern used for every other domain (see
 * `src/features/*\/api`). It keeps request/response shapes and endpoint
 * paths in one place per domain instead of scattered across components, so
 * a backend contract change only ever touches this file.
 */
export const authRepository = {
  async login({ identifier, password }: LoginCredentials): Promise<LoginResponse> {
    const isEmail = EMAIL_PATTERN.test(identifier)
    const { data } = await httpClient.post<LoginResponse>('/api/Auth/login', {
      id: isEmail ? '' : identifier,
      email: isEmail ? identifier : '',
      password,
    })
    return data
  },

  async register(payload: RegisterPayload): Promise<void> {
    await httpClient.post('/api/Auth/register', {
      id: payload.id,
      email: payload.email,
      password: payload.password,
      first_Name: payload.firstName,
      last_Name: payload.lastName,
    })
  },
}
