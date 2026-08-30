import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { SanctionDetailsDialog } from '@/features/sanctions/components/SanctionDetailsDialog'
import { env } from '@/shared/config/env'
import { aRequestDetail, aValidation } from '@/test/factories'
import { renderWithProviders, signIn } from '@/test/renderWithProviders'
import { server } from '@/test/server'

const DETAIL = `${env.apiBaseUrl}/api/sanction-requests/100`

function serveRequest(overrides = {}) {
  server.use(http.get(DETAIL, () => HttpResponse.json(aRequestDetail(overrides))))
}

function renderDialog() {
  const onChanged = vi.fn()
  const onHide = vi.fn()
  const result = renderWithProviders(
    <SanctionDetailsDialog sanctionId={100} onHide={onHide} onChanged={onChanged} />,
  )
  return { ...result, onChanged, onHide }
}

describe('SanctionDetailsDialog', () => {
  it('shows the request and its decision history', async () => {
    signIn({ userId: 'EMP001' })
    serveRequest({
      validations: [aValidation({ validatorName: 'Nadia Alaoui', note: 'Consistent with the record.' })],
    })

    renderDialog()

    expect(await screen.findByText('Amina Haddad')).toBeInTheDocument()
    expect(screen.getByText('Nadia Alaoui')).toBeInTheDocument()
    expect(screen.getByText('Consistent with the record.')).toBeInTheDocument()
  })

  /**
   * Authorisation is enforced by the API, but showing buttons that are
   * guaranteed to 403 is a bug in its own right. These two cases pin the
   * rule down: only the validator a request is currently waiting on may act.
   */
  it('offers approve and refuse to the validator the request awaits', async () => {
    signIn({ userId: 'EMP500' })
    serveRequest({ currentValidatorId: 'EMP500' })

    renderDialog()

    expect(await screen.findByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refuse/i })).toBeInTheDocument()
  })

  it('offers no decision buttons to anyone else', async () => {
    signIn({ userId: 'EMP001' })
    serveRequest({ currentValidatorId: 'EMP500' })

    renderDialog()
    await screen.findByText('Amina Haddad')

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /refuse/i })).not.toBeInTheDocument()
  })

  it('offers no decision buttons once the request is closed', async () => {
    signIn({ userId: 'EMP500' })
    serveRequest({ currentValidatorId: 'EMP500', isClosed: true })

    renderDialog()
    await screen.findByText('Amina Haddad')

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('posts the decision with the typed note and refreshes the caller', async () => {
    signIn({ userId: 'EMP500' })
    serveRequest({ currentValidatorId: 'EMP500' })

    let posted: unknown = null
    server.use(
      http.post(`${DETAIL}/decisions`, async ({ request }) => {
        posted = await request.json()
        return HttpResponse.json(aRequestDetail({ isClosed: true }))
      }),
    )

    const { user, onChanged } = renderDialog()

    await user.type(await screen.findByLabelText(/note/i), 'Substantiated by the report.')
    await user.click(screen.getByRole('button', { name: /approve/i }))

    await waitFor(() =>
      expect(posted).toEqual({ decision: 'Approved', note: 'Substantiated by the report.' }),
    )
    expect(onChanged).toHaveBeenCalled()
  })

  // An empty note must travel as null rather than "", which the API would
  // otherwise store as a blank note on the audit trail.
  it('sends a blank note as null', async () => {
    signIn({ userId: 'EMP500' })
    serveRequest({ currentValidatorId: 'EMP500' })

    let posted: { note?: unknown } = {}
    server.use(
      http.post(`${DETAIL}/decisions`, async ({ request }) => {
        posted = (await request.json()) as { note?: unknown }
        return HttpResponse.json(aRequestDetail())
      }),
    )

    const { user } = renderDialog()
    await user.click(await screen.findByRole('button', { name: /refuse/i }))

    await waitFor(() => expect(posted.note).toBeNull())
  })

  it('lets the requester withdraw their own open request', async () => {
    signIn({ userId: 'EMP900' })
    serveRequest({ requesterId: 'EMP900' })

    let cancelled = false
    server.use(
      http.post(`${DETAIL}/cancellation`, () => {
        cancelled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { user } = renderDialog()
    await user.click(await screen.findByRole('button', { name: /cancel request/i }))

    await waitFor(() => expect(cancelled).toBe(true))
  })

  it('does not offer cancellation to someone who did not raise the request', async () => {
    signIn({ userId: 'EMP001' })
    serveRequest({ requesterId: 'EMP900' })

    renderDialog()
    await screen.findByText('Amina Haddad')

    expect(screen.queryByRole('button', { name: /cancel request/i })).not.toBeInTheDocument()
  })
})
