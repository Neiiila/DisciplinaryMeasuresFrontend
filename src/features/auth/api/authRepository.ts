import { httpClient } from '@/shared/api/httpClient'
import type {
  AuthenticationResult,
  LoginCredentials,
  RegisterInput,
  RegistrationResult,
} from '@/features/auth/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The only anonymous endpoints in the API.
 *
 * `LoginRequest` takes a nullable `id` and `email` and expects exactly one of
 * them, so the single identifier the form collects is routed to whichever
 * field matches its shape.
 */
export const authRepository = {
  async login({ identifier, password }: LoginCredentials): Promise<AuthenticationResult> {
    const isEmail = EMAIL_PATTERN.test(identifier)

    const { data } = await httpClient.post<AuthenticationResult>('/api/authentication/login', {
      id: isEmail ? null : identifier,
      email: isEmail ? identifier : null,
      password,
    })

    return data
  },

  async register(input: RegisterInput): Promise<RegistrationResult> {
    const { data } = await httpClient.post<RegistrationResult>('/api/authentication/register', input)
    return data
  },
}
