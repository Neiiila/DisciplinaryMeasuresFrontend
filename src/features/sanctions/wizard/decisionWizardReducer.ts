import type { SanctionDecisionCode } from '@/features/sanctions/types'

export type WizardStep = 'status' | 'confirm'

export interface DecisionWizardState {
  step: WizardStep
  sanctionId: number
  decisionCode: SanctionDecisionCode | null
  meetingDateTime: string | null
  sendByEmail: boolean
  sendByWhatsapp: boolean
  downloadCopy: boolean
}

export type DecisionWizardAction =
  | { type: 'SELECT_DECISION'; decisionCode: SanctionDecisionCode }
  | { type: 'SET_MEETING_DATETIME'; value: string }
  | { type: 'TOGGLE_SEND_OPTION'; option: 'sendByEmail' | 'sendByWhatsapp' | 'downloadCopy' }
  | { type: 'GO_TO_STEP'; step: WizardStep }

export function createInitialState(sanctionId: number): DecisionWizardState {
  return {
    step: 'status',
    sanctionId,
    decisionCode: null,
    meetingDateTime: null,
    sendByEmail: false,
    sendByWhatsapp: false,
    downloadCopy: false,
  }
}

/**
 * The legacy `GlobalDataService` passed this same kind of state between
 * sibling routed step components through a grab-bag of `BehaviorSubject`s
 * — and one of its two "invoke" channels (`invokedMeetingFunction$`) was
 * accidentally wired to the very same subject as the other
 * (`invokedFunction$`), so triggering the sanction wizard's final step
 * could silently also fire the meeting wizard's handler.
 *
 * A reducer keeps every transition explicit and exhaustively typed, and
 * because it is instantiated fresh per `sanctionId` (see
 * `DecisionWizardProvider`) two wizards can never cross-talk.
 */
export function decisionWizardReducer(
  state: DecisionWizardState,
  action: DecisionWizardAction,
): DecisionWizardState {
  switch (action.type) {
    case 'SELECT_DECISION':
      return { ...state, decisionCode: action.decisionCode }
    case 'SET_MEETING_DATETIME':
      return { ...state, meetingDateTime: action.value }
    case 'TOGGLE_SEND_OPTION':
      return { ...state, [action.option]: !state[action.option] }
    case 'GO_TO_STEP':
      return { ...state, step: action.step }
    default:
      return state
  }
}
