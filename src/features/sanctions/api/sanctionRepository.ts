import { httpClient } from '@/shared/api/httpClient'
import { buildFormData } from '@/shared/lib/buildFormData'
import type { ValidationDecision } from '@/shared/config/roles'
import type {
  Fault,
  RaiseSanctionRequestInput,
  SanctionRequestDetail,
  SanctionRequestSummary,
} from '@/features/sanctions/types'

/**
 * The sanction request workflow.
 *
 * Two things the API decides for us, so the client never sends them: the
 * requester is taken from the token (a caller cannot raise a request in
 * someone else's name), and so is the validator when recording a decision.
 */
export const sanctionRepository = {
  /** Every request in the system. Administrators only. */
  async getAll(): Promise<SanctionRequestSummary[]> {
    const { data } = await httpClient.get<SanctionRequestSummary[]>('/api/sanction-requests')
    return data
  },

  async getById(id: number): Promise<SanctionRequestDetail> {
    const { data } = await httpClient.get<SanctionRequestDetail>(`/api/sanction-requests/${id}`)
    return data
  },

  /** Requests the caller has raised. */
  async getMine(): Promise<SanctionRequestSummary[]> {
    const { data } = await httpClient.get<SanctionRequestSummary[]>('/api/sanction-requests/mine')
    return data
  },

  /** Requests awaiting the caller, plus those they have already answered. */
  async getAddressedToMe(): Promise<SanctionRequestSummary[]> {
    const { data } = await httpClient.get<SanctionRequestSummary[]>('/api/sanction-requests/addressed-to-me')
    return data
  },

  async raise(input: RaiseSanctionRequestInput): Promise<SanctionRequestDetail> {
    const formData = buildFormData(
      {
        description: input.description,
        details: input.details,
        employeeId: input.employeeId,
        faultId: input.faultId,
        'ProposedFault.Title': input.proposedFault?.title ?? null,
        'ProposedFault.Category': input.proposedFault?.category ?? null,
      },
      { attachment: input.attachment },
    )

    const { data } = await httpClient.post<SanctionRequestDetail>('/api/sanction-requests', formData)
    return data
  },

  /** Records the caller's answer on a request awaiting them. */
  async recordDecision(
    id: number,
    decision: ValidationDecision,
    note: string | null,
  ): Promise<SanctionRequestDetail> {
    const { data } = await httpClient.post<SanctionRequestDetail>(
      `/api/sanction-requests/${id}/decisions`,
      { decision, note },
    )
    return data
  },

  /** Cancels a request. Only its requester may do so. */
  async cancel(id: number): Promise<void> {
    await httpClient.post(`/api/sanction-requests/${id}/cancellation`)
  },

  /** The validated fault catalogue, for the request form's picker. */
  async getFaults(): Promise<Fault[]> {
    const { data } = await httpClient.get<Fault[]>('/api/faults')
    return data
  },
}
