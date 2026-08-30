import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { useAuthStore } from '@/features/auth/store/authStore'
import { env } from '@/shared/config/env'
import { tokenStorage } from '@/shared/lib/tokenStorage'
import { renderWithProviders, signOut } from '@/test/renderWithProviders'
import { server } from '@/test/server'
import { makeToken } from '@/test/tokens'

const LOGIN = `${env.apiBaseUrl}/api/authentication/login`

async function submitCredentials(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText(/matriculation number or email/i), 'EMP001')
  await user.type(screen.getByLabelText(/^password$/i), 'passw0rd')
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('LoginPage', () => {
  it('rejects an empty submission without calling the API', async () => {
    signOut()
    const { user } = renderWithProviders(<LoginPage />)

    // No MSW handler is registered, so any request would fail the suite.
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/enter your matriculation number or email/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument()
  })

  it('stores the token and signs the user in on success', async () => {
    signOut()
    const token = makeToken({ userId: 'EMP001', displayName: 'Amina Haddad' })

    server.use(
      http.post(LOGIN, () =>
        HttpResponse.json({
          token,
          expiresOn: '2026-12-31T00:00:00Z',
          userId: 'EMP001',
          displayName: 'Amina Haddad',
          role: 'Employee',
          photoPath: null,
        }),
      ),
    )

    const { user } = renderWithProviders(<LoginPage />)
    await submitCredentials(user)

    await waitFor(() => expect(tokenStorage.get()).toBe(token))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toMatchObject({ userId: 'EMP001', role: 'Employee' })
  })

  /**
   * The API answers 403 when an account exists but is Pending or Revoked.
   * Showing its message matters: "awaiting activation" is actionable in a
   * way that a generic "sign-in failed" is not.
   */
  it('surfaces the reason a not-yet-activated account is refused', async () => {
    signOut()
    server.use(
      http.post(LOGIN, () =>
        HttpResponse.json(
          { title: 'This account is awaiting activation.', code: 'auth.not_activated' },
          { status: 403 },
        ),
      ),
    )

    const { user } = renderWithProviders(<LoginPage />)
    await submitCredentials(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/awaiting activation/i)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('leaves no token behind when credentials are wrong', async () => {
    signOut()
    server.use(
      http.post(LOGIN, () =>
        HttpResponse.json({ title: 'Wrong identifier or password.' }, { status: 401 }),
      ),
    )

    const { user } = renderWithProviders(<LoginPage />)
    await submitCredentials(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/wrong identifier or password/i)
    expect(tokenStorage.get()).toBeNull()
  })

  it('explains a server that cannot be reached', async () => {
    signOut()
    server.use(http.post(LOGIN, () => HttpResponse.error()))

    const { user } = renderWithProviders(<LoginPage />)
    await submitCredentials(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i)
  })
})
