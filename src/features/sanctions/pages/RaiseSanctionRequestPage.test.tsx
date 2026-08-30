import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { RaiseSanctionRequestPage } from '@/features/sanctions/pages/RaiseSanctionRequestPage'
import { env } from '@/shared/config/env'
import { aFault, anEmployee, aRequestDetail } from '@/test/factories'
import { renderWithProviders, signIn } from '@/test/renderWithProviders'
import { server } from '@/test/server'

const RAISE = `${env.apiBaseUrl}/api/sanction-requests`

function serveLookups() {
  server.use(
    http.get(`${env.apiBaseUrl}/api/employees`, () =>
      HttpResponse.json([anEmployee({ id: 'EMP001', fullName: 'Amina Haddad' })]),
    ),
    http.get(`${env.apiBaseUrl}/api/faults`, () =>
      HttpResponse.json([aFault({ id: 4, title: 'Unexcused absence', category: 'Attendance' })]),
    ),
  )
}

async function chooseOption(
  user: ReturnType<typeof renderWithProviders>['user'],
  labelText: RegExp,
  optionText: RegExp,
) {
  await user.click(screen.getByLabelText(labelText))
  await user.click(await screen.findByText(optionText))
}

describe('RaiseSanctionRequestPage', () => {
  it('will not submit without an employee, a fault and a description', async () => {
    signIn()
    serveLookups()

    const { user } = renderWithProviders(<RaiseSanctionRequestPage />)
    await user.click(screen.getByRole('button', { name: /raise request/i }))

    expect(await screen.findByText(/choose the employee this concerns/i)).toBeInTheDocument()
    expect(screen.getByText(/choose a fault/i)).toBeInTheDocument()
    expect(screen.getByText(/a description is required/i)).toBeInTheDocument()
  })

  it('submits a catalogued fault by id', async () => {
    signIn()
    serveLookups()

    let body: FormData | null = null
    server.use(
      http.post(RAISE, async ({ request }) => {
        body = await request.formData()
        return HttpResponse.json(aRequestDetail(), { status: 201 })
      }),
    )

    const { user } = renderWithProviders(<RaiseSanctionRequestPage />)

    await chooseOption(user, /employee/i, /Amina Haddad/)
    await chooseOption(user, /fault/i, /Unexcused absence/)
    await user.type(screen.getByLabelText(/^description$/i), 'Absent on Monday')
    await user.click(screen.getByRole('button', { name: /raise request/i }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body!.get('faultId')).toBe('4')
    expect(body!.get('ProposedFault.Title')).toBeNull()
  })

  /**
   * Choosing "not listed" swaps the request from citing a catalogued fault
   * to proposing a new one. The API rejects a payload carrying both, so this
   * covers the branch that decides between them.
   */
  it('reveals the proposal fields and requires a title for a new fault', async () => {
    signIn()
    serveLookups()

    const { user } = renderWithProviders(<RaiseSanctionRequestPage />)

    await chooseOption(user, /employee/i, /Amina Haddad/)
    await chooseOption(user, /fault/i, /Not listed/)

    expect(await screen.findByLabelText(/^title$/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^description$/i), 'Something new')
    await user.click(screen.getByRole('button', { name: /raise request/i }))

    expect(await screen.findByText(/give the proposed fault a title/i)).toBeInTheDocument()
  })

  it('submits a proposed fault instead of a fault id', async () => {
    signIn()
    serveLookups()

    let body: FormData | null = null
    server.use(
      http.post(RAISE, async ({ request }) => {
        body = await request.formData()
        return HttpResponse.json(aRequestDetail(), { status: 201 })
      }),
    )

    const { user } = renderWithProviders(<RaiseSanctionRequestPage />)

    await chooseOption(user, /employee/i, /Amina Haddad/)
    await chooseOption(user, /fault/i, /Not listed/)
    await user.type(await screen.findByLabelText(/^title$/i), 'Equipment misuse')
    await user.type(screen.getByLabelText(/^category$/i), 'Conduct')
    await user.type(screen.getByLabelText(/^description$/i), 'Damaged a press')
    await user.click(screen.getByRole('button', { name: /raise request/i }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body!.get('faultId')).toBeNull()
    expect(body!.get('ProposedFault.Title')).toBe('Equipment misuse')
    expect(body!.get('ProposedFault.Category')).toBe('Conduct')
  })
})
