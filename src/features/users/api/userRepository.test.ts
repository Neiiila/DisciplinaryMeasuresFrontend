// @vitest-environment node
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { userRepository } from '@/features/users/api/userRepository'
import { EMPTY_EMPLOYMENT } from '@/features/users/types'
import { ROLES } from '@/shared/config/roles'
import { env } from '@/shared/config/env'
import { aNotification, aUser } from '@/test/factories'
import { server } from '@/test/server'

const api = (path: string) => `${env.apiBaseUrl}${path}`

describe('userRepository', () => {
  it('lists users from /api/users', async () => {
    server.use(http.get(api('/api/users'), () => HttpResponse.json([aUser()])))

    await expect(userRepository.getAll()).resolves.toHaveLength(1)
  })

  it('reads the nested employment object the API returns', async () => {
    server.use(
      http.get(api('/api/users/EMP001'), () =>
        HttpResponse.json(
          aUser({ employment: { ...EMPTY_EMPLOYMENT, department: 'Quality', businessUnit: 'BU2' } }),
        ),
      ),
    )

    const user = await userRepository.getById('EMP001')

    expect(user.employment).toMatchObject({ department: 'Quality', businessUnit: 'BU2' })
  })

  /**
   * ASP.NET model binding reconstructs the nested `EmploymentDto` from
   * dotted form keys. Sending it any other way (JSON string, flat keys)
   * silently binds an empty record, so the shape is pinned here.
   */
  it('flattens employment into dotted form keys on create', async () => {
    let body: FormData | null = null
    server.use(
      http.post(api('/api/users'), async ({ request }) => {
        body = await request.formData()
        return HttpResponse.json(aUser(), { status: 201 })
      }),
    )

    await userRepository.create(
      {
        id: 'EMP010',
        firstName: 'Yasmine',
        lastName: 'Fassi',
        cin: null,
        email: 'yasmine@company.com',
        password: 'passw0rd',
        address: null,
        phoneNumber: null,
        gender: null,
        supervisorId: 'EMP001',
        role: ROLES.EMPLOYEE,
        employment: { ...EMPTY_EMPLOYMENT, department: 'Logistics', position: 'Planner' },
      },
      null,
    )

    expect(body!.get('id')).toBe('EMP010')
    expect(body!.get('role')).toBe('Employee')
    expect(body!.get('Employment.Department')).toBe('Logistics')
    expect(body!.get('Employment.Position')).toBe('Planner')
  })

  // Null fields must be omitted rather than sent as the string "null",
  // which is what a naive String() conversion would produce.
  it('omits null fields instead of stringifying them', async () => {
    let body: FormData | null = null
    server.use(
      http.post(api('/api/users'), async ({ request }) => {
        body = await request.formData()
        return HttpResponse.json(aUser(), { status: 201 })
      }),
    )

    await userRepository.create(
      {
        id: 'EMP011',
        firstName: 'Omar',
        lastName: 'Ziani',
        cin: null,
        email: null,
        password: null,
        address: null,
        phoneNumber: null,
        gender: null,
        supervisorId: null,
        role: ROLES.GUEST,
        employment: EMPTY_EMPLOYMENT,
      },
      null,
    )

    expect(body!.get('email')).toBeNull()
    expect(body!.get('password')).toBeNull()
    expect(body!.get('Employment.Department')).toBeNull()
  })

  it('sends the photo alongside the record when one is chosen', async () => {
    let body: FormData | null = null
    server.use(
      http.put(api('/api/users/EMP001'), async ({ request }) => {
        body = await request.formData()
        return HttpResponse.json(aUser())
      }),
    )

    await userRepository.update(
      'EMP001',
      {
        firstName: 'Amina',
        lastName: 'Haddad',
        cin: null,
        email: null,
        address: null,
        phoneNumber: null,
        gender: null,
        supervisorId: null,
        role: ROLES.EMPLOYEE,
        employment: EMPTY_EMPLOYMENT,
      },
      new File(['x'], 'me.png', { type: 'image/png' }),
    )

    expect((body!.get('photo') as File).name).toBe('me.png')
  })

  it('opens an account through the account sub-resource', async () => {
    let body: unknown = null
    server.use(
      http.post(api('/api/users/EMP001/account'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(aUser())
      }),
    )

    await userRepository.openAccount('EMP001', {
      email: 'amina@company.com',
      password: 'passw0rd',
      role: ROLES.ADMINISTRATOR,
    })

    expect(body).toEqual({
      email: 'amina@company.com',
      password: 'passw0rd',
      role: 'Administrator',
    })
  })

  it('activates through POST /activation and revokes through DELETE /account', async () => {
    const calls: string[] = []
    server.use(
      http.post(api('/api/users/EMP001/activation'), () => {
        calls.push('activate')
        return new HttpResponse(null, { status: 204 })
      }),
      http.delete(api('/api/users/EMP001/account'), () => {
        calls.push('revoke')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await userRepository.activate('EMP001')
    await userRepository.revokeAccount('EMP001')

    expect(calls).toEqual(['activate', 'revoke'])
  })

  it('reads notifications from the token-scoped /me route', async () => {
    server.use(
      http.get(api('/api/users/me/notifications'), () => HttpResponse.json([aNotification()])),
    )

    await expect(userRepository.getMyNotifications()).resolves.toHaveLength(1)
  })
})