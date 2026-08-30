import { Steps } from 'primereact/steps'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import type { SanctionRequest } from '@/features/sanctions/types'
import {
  DecisionWizardProvider,
  useDecisionWizardDispatch,
  useDecisionWizardState,
} from '@/features/sanctions/wizard/DecisionWizardContext'
import { ConfirmStep } from '@/features/sanctions/wizard/steps/ConfirmStep'
import { StatusStep } from '@/features/sanctions/wizard/steps/StatusStep'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

export function HrDecisionWizardPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const [request, setRequest] = useState<SanctionRequest | null>(null)

  useEffect(() => {
    if (!id) return
    sanctionRepository
      .getById(Number(id))
      .then(setRequest)
      .catch((error) => toast.error('Could not load request', getErrorMessage(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!id) return null

  return (
    <div className="page">
      <div className="page-header">
        <h1>HR decision</h1>
      </div>
      {!request ? (
        <p>Loading…</p>
      ) : (
        <DecisionWizardProvider sanctionId={request.id}>
          <WizardSteps request={request} />
        </DecisionWizardProvider>
      )}
    </div>
  )
}

function WizardSteps({ request }: { request: SanctionRequest }) {
  const state = useDecisionWizardState()
  const dispatch = useDecisionWizardDispatch()

  return (
    <>
      <Steps
        model={[{ label: 'New status' }, { label: 'Confirm' }]}
        activeIndex={state.step === 'status' ? 0 : 1}
        readOnly
      />
      {state.step === 'status' ? (
        <StatusStep onNext={() => dispatch({ type: 'GO_TO_STEP', step: 'confirm' })} />
      ) : (
        <ConfirmStep request={request} onBack={() => dispatch({ type: 'GO_TO_STEP', step: 'status' })} />
      )}
    </>
  )
}
