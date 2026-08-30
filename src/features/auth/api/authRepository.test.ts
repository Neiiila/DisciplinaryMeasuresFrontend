// @vitest-environment node
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { authRepository } from '@/features/auth/api/authRepository'
import { env } from '@/shared/config/env'
import { server } from '@/test/server'
import { makeToken } from '@/test/tokens'

const LOGIN = `${env.apiBaseUrl}/api/authentication/login`
const REGISTER = `${env.apiBaseUrl}/api/authentication/register`

describe('authRepository.login', () => {
  /**
   * `LoginRequest` accepts a nullable id and email and expects exactly one.
   * The form collects a single identifier, so these two cases pin down the
   * routing between the fields.
   */
  it('sends an email-shaped identifier as email, leaving id null', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(LOGIN, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ token: makeToken() })
      }),
    )

    await authRepository.login({ identifier: 'amina@company.com', password: 'secret' })

    expect(body).toMatchObject({ email: 'amina@company.com', id: null })
  })

  it('sends anything else as the matriculation number, leaving email null', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(LOGIN, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ token: makeToken() })
      }),
    )

    await authRepository.login({ identifier: 'EMP001', password: 'secret' })

    expect(body).toMatchObject({ id: 'EMP001', email: null })
  })

  it('returns the token and identity the API issues', async () => {
    const token = makeToken()
    server.use(
      http.post(LOGIN, () =>
        HttpResponse.json({
          token,
          expiresOn: '2026-09-01T00:00:00Z',
          userId: 'EMP001',
          displayName: 'Amina Haddad',
          role: 'Administrator',
          photoPath: 'uploads/photo.jpg',
        }),
      ),
    )

    await expect(authRepository.login({ identifier: 'EMP001', password: 'x' })).resolves.toMatchObject({
      userId: 'EMP001',
      role: 'Administrator',
      photoPath: 'uploads/photo.jpg',
    })
  })

  it('propagates a rejected sign-in', async () => {
    server.use(
      http.post(LOGIN, () =>
        HttpResponse.json({ title: 'Wrong identifier or password.', code: 'auth.invalid' }, { status: 401 }),
      ),
    )

    await expect(authRepository.login({ identifier: 'EMP001', password: 'wrong' })).rejects.toThrow()
  })
})

describe('authRepository.register', () => {
  it('posts the registration payload and returns the pending result', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(REGISTER, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ userId: 'EMP123', displayName: 'New Person', awaitingActivation: true })
      }),
    )

    const result = await authRepository.register({
      id: 'EMP123',
      firstName: 'New',
      lastName: 'Person',
      email: 'new.person@company.com',
      password: 'passw0rd',
      cin: null,
      phoneNumber: null,
      address: null,
    })

    expect(body).toMatchObject({ id: 'EMP123', firstName: 'New', email: 'new.person@company.com' })
    expect(result.awaitingActivation).toBe(true)
  })
})