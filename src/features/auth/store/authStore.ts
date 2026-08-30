import { create } from 'zustand'
import { authRepository } from '@/features/auth/api/authRepository'
import type { LoginCredentials, RegisterInput, RegistrationResult } from '@/features/auth/types'
import { decodeToken, isTokenExpired, type AuthenticatedUser } from '@/shared/lib/jwt'
import { tokenStorage } from '@/shared/lib/tokenStorage'

export interface SessionUser extends AuthenticatedUser {
  photoPath: string | null
}

interface AuthState {
  user: SessionUser | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (input: RegisterInput) => Promise<RegistrationResult>
  logout: () => void
}

/**
 * Rehydrates the session from a stored token on boot.
 *
 * An expired token is discarded here rather than left for the first API call
 * to reject, so a returning user with a stale token lands on the login page
 * instead of a dashboard that fails to load.
 */
function restoreSession(): SessionUser | null {
  const token = tokenStorage.get()
  if (!token || isTokenExpired(token)) {
    tokenStorage.clear()
    return null
  }

  const user = decodeToken(token)
  if (!user) {
    tokenStorage.clear()
    return null
  }

  // The photo is not a token claim; it is refetched with the user's record.
  return { ...user, photoPath: null }
}

const initialUser = restoreSession()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: initialUser !== null,

  async login(credentials) {
    const result = await authRepository.login(credentials)

    tokenStorage.set(result.token)

    set({
      user: {
        userId: result.userId,
        displayName: result.displayName,
        role: result.role,
        email: null,
        photoPath: result.photoPath,
      },
      isAuthenticated: true,
    })
  },

  async register(input) {
    return authRepository.register(input)
  },

  logout() {
    tokenStorage.clear()
    set({ user: null, isAuthenticated: false })
  },
}))
