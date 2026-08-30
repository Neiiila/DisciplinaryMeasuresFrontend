// @vitest-environment node
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import { VALIDATION_DECISIONS } from '@/shared/config/roles'
import { env } from '@/shared/config/env'
import { tokenStorage } from '@/shared/lib/tokenStorage'
import { aFault, aRequestDetail, aRequestSummary } from '@/test/factories'
import { server } from '@/test/server'
import { makeToken } from '@/test/tokens'

const api = (path: string) => `${env.apiBaseUrl}${path}`

/**
 * These lock the repository to the routes and payload shapes the .NET API
 * actually exposes. If a route is renamed on either side, or a field the UI
 * depends on stops being sent, one of these fails.
 */
describe('sanctionRepository', () => {
  it('lists every request from /api/sanction-requests', async () => {
    server.use(
      http.get(api('/api/sanction-requests'), () => HttpResponse.json([aRequestSummary({ id: 7 })])),
    )

    const requests = await sanctionRepository.getAll()

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ id: 7, progress: { display: '1/2' } })
  })

  it('reads the caller\'s own requests from /mine', async () => {
    server.use(http.get(api('/api/sanction-requests/mine'), () => HttpResponse.json([aRequestSummary()])))

    await expect(sanctionRepository.getMine()).resolves.toHaveLength(1)
  })

  it('reads requests routed to the caller from /addressed-to-me', async () => {
    server.use(
      http.get(api('/api/sanction-requests/addressed-to-me'), () => HttpResponse.json([aRequestSummary()])),
    )

    await expect(sanctionRepository.getAddressedToMe()).resolves.toHaveLength(1)
  })

  it('fetches the fault catalogue from the root-level /api/faults route', async () => {
    server.use(http.get(api('/api/faults'), () => HttpResponse.json([aFault()])))

    await expect(sanctionRepository.getFaults()).resolves.toEqual([aFault()])
  })

  it('attaches the bearer token to every request', async () => {
    const token = makeToken()
    tokenStorage.set(token)

    let seen: string | null = null
    server.use(
      http.get(api('/api/sanction-requests'), ({ request }) => {
        seen = request.headers.get('Authorization')
        return HttpResponse.json([])
      }),
    )

    await sanctionRepository.getAll()

    expect(seen).toBe(`Bearer ${token}`)
  })

  describe('raise', () => {
    it('sends a catalogued fault as faultId and omits proposedFault', async () => {
      let body: FormData | null = null
      server.use(
        http.post(api('/api/sanction-requests'), async ({ request }) => {
          body = await request.formData()
          return HttpResponse.json(aRequestDetail(), { status: 201 })
        }),
      )

      await sanctionRepository.raise({
        employeeId: 'EMP001',
        description: 'Late three times',
        details: '',
        faultId: 4,
        proposedFault: null,
        attachment: null,
      })

      expect(body!.get('faultId')).toBe('4')
      expect(body!.get('employeeId')).toBe('EMP001')
      expect(body!.get('ProposedFault.Title')).toBeNull()
    })

    // The API requires exactly one of faultId / proposedFault, so sending an
    // empty faultId alongside a proposal would be rejected as ambiguous.
    it('sends a proposed fault as flattened fields and omits faultId', async () => {
      let body: FormData | null = null
      server.use(
        http.post(api('/api/sanction-requests'), async ({ request }) => {
          body = await request.formData()
          return HttpResponse.json(aRequestDetail(), { status: 201 })
        }),
      )

      await sanctionRepository.raise({
        employeeId: 'EMP001',
        description: 'Misuse of equipment',
        details: 'Second occurrence',
        faultId: null,
        proposedFault: { title: 'Equipment misuse', category: 'Conduct' },
        attachment: null,
      })

      expect(body!.get('faultId')).toBeNull()
      expect(body!.get('ProposedFault.Title')).toBe('Equipment misuse')
      expect(body!.get('ProposedFault.Category')).toBe('Conduct')
    })

    it('includes the attachment when one is given', async () => {
      let body: FormData | null = null
      server.use(
        http.post(api('/api/sanction-requests'), async ({ request }) => {
          body = await request.formData()
          return HttpResponse.json(aRequestDetail(), { status: 201 })
        }),
      )

      await sanctionRepository.raise({
        employeeId: 'EMP001',
        description: 'With evidence',
        details: '',
        faultId: 1,
        proposedFault: null,
        attachment: new File(['report'], 'report.pdf', { type: 'application/pdf' }),
      })

      expect((body!.get('attachment') as File).name).toBe('report.pdf')
    })
  })

  it('posts a decision as the enum name the API expects', async () => {
    let body: unknown = null
    server.use(
      http.post(api('/api/sanction-requests/100/decisions'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(aRequestDetail())
      }),
    )

    await sanctionRepository.recordDecision(100, VALIDATION_DECISIONS.REFUSED, 'Not substantiated')

    expect(body).toEqual({ decision: 'Refused', note: 'Not substantiated' })
  })

  it('cancels through the cancellation sub-resource', async () => {
    let called = false
    server.use(
      http.post(api('/api/sanction-requests/100/cancellation'), () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await sanctionRepository.cancel(100)

    expect(called).toBe(true)
  })
})