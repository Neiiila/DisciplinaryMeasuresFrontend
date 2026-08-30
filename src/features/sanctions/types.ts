import type { ValidationDecision } from '@/shared/config/roles'

/** A catalogued misconduct type. */
export interface Fault {
  id: number
  title: string
  category: string
  isValidated: boolean
}

/** A fault proposed inline while raising a request. */
export interface ProposedFault {
  title: string
  category: string
}

/** How far a request has travelled up the approval chain. */
export interface Progress {
  completed: number
  required: number
  /** The "completed/required" form, rendered by the backend. */
  display: string
}

/** One recorded answer in a request's history. */
export interface Validation {
  validatorId: string
  validatorName: string | null
  decision: ValidationDecision
  note: string | null
  decidedOn: string
}

/** A sanction request as it appears in a list. */
export interface SanctionRequestSummary {
  id: number
  description: string
  requestedOn: string
  employeeId: string
  employeeName: string | null
  requesterId: string
  requesterName: string | null
  faultTitle: string | null
  progress: Progress
  currentValidatorId: string | null
  isCancelled: boolean
  isRefused: boolean
  isClosed: boolean
}

/** A sanction request with its full decision history. */
export interface SanctionRequestDetail extends Omit<SanctionRequestSummary, 'faultTitle'> {
  details: string
  fault: Fault | null
  attachmentPath: string | null
  currentValidatorName: string | null
  validations: Validation[]
}

export interface RaiseSanctionRequestInput {
  description: string
  details: string
  employeeId: string
  /** Supply exactly one of `faultId` or `proposedFault`. */
  faultId: number | null
  proposedFault: ProposedFault | null
  attachment: File | null
}
