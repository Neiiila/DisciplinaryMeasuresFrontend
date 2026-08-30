export interface Fault {
  id?: number
  title: string
  titleAr: string
  type?: string
  isValidated: boolean
}

export interface RequestStatus {
  validatorId: string
  validatorName: string
  status: boolean | null
  date: string | null
  note: string | null
}

export interface SanctionRequest {
  id: number
  employeeId: string
  employeeName: string
  requesterId: string
  faultTitle: string
  description: string
  requestDate: string
  attachments: string[]
  /** e.g. "2/3" — how many approvals have been collected out of how many required. */
  validationLevel: string
  statuses: RequestStatus[]
}

export type SanctionDecisionCode = 'avertissement' | 'blame1' | 'blame2' | 'blame3' | 'ep'

export interface Decision {
  sanctionId: number
  employeeNewStatus: SanctionDecisionCode
  decisionDate: string
}

export interface Meeting {
  id: number
  sanctionId: number
  employeeId: string
  employeeName: string
  faultTitle: string
  meetingDate: string
}
