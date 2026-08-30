import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import {
  createInitialState,
  decisionWizardReducer,
  type DecisionWizardAction,
  type DecisionWizardState,
} from '@/features/sanctions/wizard/decisionWizardReducer'

const StateContext = createContext<DecisionWizardState | null>(null)
const DispatchContext = createContext<Dispatch<DecisionWizardAction> | null>(null)

export function DecisionWizardProvider({ sanctionId, children }: { sanctionId: number; children: ReactNode }) {
  const [state, dispatch] = useReducer(decisionWizardReducer, sanctionId, createInitialState)

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useDecisionWizardState(): DecisionWizardState {
  const context = useContext(StateContext)
  if (!context) throw new Error('useDecisionWizardState must be used within a DecisionWizardProvider')
  return context
}

export function useDecisionWizardDispatch(): Dispatch<DecisionWizardAction> {
  const context = useContext(DispatchContext)
  if (!context) throw new Error('useDecisionWizardDispatch must be used within a DecisionWizardProvider')
  return context
}
