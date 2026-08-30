import { httpClient, whatsappClient } from '@/shared/api/httpClient'
import { buildFormData } from '@/shared/lib/buildFormData'
import { ROLES, type Role } from '@/shared/config/roles'
import type { Decision, Fault, Meeting, SanctionRequest } from '@/features/sanctions/types'

/**
 * The legacy Angular services relied on `any` for every one of these
 * payloads, so the shapes below are reverse-engineered from how the
 * components consumed them rather than from a formal API contract. Treat
 * this file as the single place to correct field names once the real
 * backend schema is confirmed.
 */
export const sanctionRepository = {
  async getFaults(): Promise<Fault[]> {
    const { data } = await httpClient.get<Fault[]>('/faults')
    return data
  },

  async getAll(): Promise<SanctionRequest[]> {
    const { data } = await httpClient.get<SanctionRequest[]>('/api/SanctionRequests')
    return data
  },

  async getByBusinessUnit(businessUnit: string): Promise<SanctionRequest[]> {
    const { data } = await httpClient.get<SanctionRequest[]>('/api/SanctionRequests/BU', {
      params: { bu: businessUnit },
    })
    return data
  },

  async getForRole(role: Role, businessUnit: string | null): Promise<SanctionRequest[]> {
    if (role === ROLES.SUPER_ADMIN || !businessUnit) return this.getAll()
    return this.getByBusinessUnit(businessUnit)
  },

  async getById(id: number): Promise<SanctionRequest> {
    const { data } = await httpClient.get<SanctionRequest>(`/api/SanctionRequests/${id}`)
    return data
  },

  async getMyRequests(userId: string): Promise<SanctionRequest[]> {
    const { data } = await httpClient.get<SanctionRequest[]>('/usersRequests', { params: { userId } })
    return data
  },

  async getReceivedRequests(userId: string): Promise<SanctionRequest[]> {
    const { data } = await httpClient.get<SanctionRequest[]>('/GetRecievedRequests', { params: { userId } })
    return data
  },

  async getPreparedRequests(): Promise<SanctionRequest[]> {
    const { data } = await httpClient.get<SanctionRequest[]>('/GetPreparedRequests')
    return data
  },

  async getPreparedRequestsByBusinessUnit(businessUnit: string): Promise<SanctionRequest[]> {
    const { data } = await httpClient.get<SanctionRequest[]>('/GetPreparedRequests/BU', {
      params: { bu: businessUnit },
    })
    return data
  },

  async getPreparedRequestsForRole(role: Role, businessUnit: string | null): Promise<SanctionRequest[]> {
    if (role === ROLES.SUPER_ADMIN || !businessUnit) return this.getPreparedRequests()
    return this.getPreparedRequestsByBusinessUnit(businessUnit)
  },

  async create(input: {
    employeeId: string
    requesterId: string
    fault: Fault
    isNewFault: boolean
    description: string
    requestDate: string
    details: string
    files: File[]
  }): Promise<void> {
    const formData = buildFormData(
      {
        EmployeeId: input.employeeId,
        RequesterId: input.requesterId,
        Description: input.description,
        Request_Date: input.requestDate,
        Details: input.details,
        ...(input.isNewFault
          ? {
              'Fault.Title': input.fault.title,
              'Fault.TitleAr': input.fault.titleAr,
              'Fault.Type': input.fault.type ?? '',
              'Fault.IsValidated': false,
            }
          : { FaultId: input.fault.id }),
      },
      { files: input.files },
    )
    await httpClient.post('/api/SanctionRequests', formData)
  },

  async respond(input: {
    sanctionId: number
    validatorId: string
    status: boolean
    note: string
  }): Promise<void> {
    await httpClient.post('/RequestStatuses', {
      sanctionId: input.sanctionId,
      validatorId: input.validatorId,
      date: new Date().toISOString(),
      status: input.status,
      note: input.note,
    })
  },

  async refuse(sanctionId: number): Promise<void> {
    await httpClient.put('/refuseRequest', null, { params: { id: sanctionId } })
  },

  async getCurrentSanctions(userId: string): Promise<SanctionRequest[]> {
    const { data } = await httpClient.get<SanctionRequest[]>('/GetCurrentSanctions', { params: { userId } })
    return data
  },

  async addDecision(decision: Decision, send: boolean, file: File | null): Promise<void> {
    const formData = buildFormData(
      {
        SanctionId: decision.sanctionId,
        EmployeeNewStatus: decision.employeeNewStatus,
        Decision_Date: decision.decisionDate,
        send,
      },
      { file },
    )
    await httpClient.post('/postDecision', formData)
  },

  async addMeeting(sanctionId: number, meetingDate: string, send: boolean, file: File | null): Promise<void> {
    const formData = buildFormData({ SanctionId: sanctionId, Meeting_Date: meetingDate, send }, { file })
    await httpClient.post('/postMeeting', formData)
  },

  async getMeetings(): Promise<Meeting[]> {
    const { data } = await httpClient.get<Meeting[]>('/meetings')
    return data
  },

  async getMeetingsByBusinessUnit(businessUnit: string): Promise<Meeting[]> {
    const { data } = await httpClient.get<Meeting[]>('/meetings/BU', { params: { bu: businessUnit } })
    return data
  },

  async getMeetingsForRole(role: Role, businessUnit: string | null): Promise<Meeting[]> {
    if (role === ROLES.SUPER_ADMIN || !businessUnit) return this.getMeetings()
    return this.getMeetingsByBusinessUnit(businessUnit)
  },

  /**
   * Sends a generated document through the optional WhatsApp messaging
   * microservice. The legacy code hardcoded a personal test phone number
   * here instead of taking the recipient as a parameter — that number is
   * now supplied by the caller.
   */
  async sendViaWhatsapp(phoneNumber: string, message: string, file: File): Promise<void> {
    const formData = buildFormData({ number: phoneNumber, message }, { file })
    await whatsappClient.post('/send-message', formData)
  },
}
