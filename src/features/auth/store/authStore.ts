import { create } from 'zustand'
import { authRepository } from '@/features/auth/api/authRepository'
import type { LoginCredentials, RegisterPayload } from '@/features/auth/types'
import { decodeToken, isTokenExpired, type AuthenticatedUser } from '@/shared/lib/jwt'
import { tokenStorage } from '@/shared/lib/tokenStorage'

interface AuthState {
  user: AuthenticatedUser | null
  isInitialized: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

function restoreUser(): AuthenticatedUser | null {
  const token = tokenStorage.get()
  if (!token || isTokenExpired(token)) {
    tokenStorage.clear()
    return null
  }
  return decodeToken(token)
}

const initialUser = restoreUser()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isInitialized: true,
  isAuthenticated: initialUser !== null,

  async login(credentials) {
    const { token } = await authRepository.login(credentials)
    const user = decodeToken(token)
    if (!user) {
      throw new Error('The server returned a token that could not be read.')
    }
    tokenStorage.set(token)
    set({ user, isAuthenticated: true })
  },

  async register(payload) {
    await authRepository.register(payload)
  },

  logout() {
    tokenStorage.clear()
    set({ user: null, isAuthenticated: false })
  },
}))
