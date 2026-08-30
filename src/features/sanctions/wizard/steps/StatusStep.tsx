import { Button } from 'primereact/button'
import { useDecisionWizardDispatch, useDecisionWizardState } from '@/features/sanctions/wizard/DecisionWizardContext'
import { DECISION_LABELS } from '@/features/sanctions/pdf/decisionLabels'
import type { SanctionDecisionCode } from '@/features/sanctions/types'

const DECISION_ORDER: SanctionDecisionCode[] = ['avertissement', 'blame1', 'blame2', 'blame3', 'ep']

export function StatusStep({ onNext }: { onNext: () => void }) {
  const state = useDecisionWizardState()
  const dispatch = useDecisionWizardDispatch()

  return (
    <div className="wizard-step">
      <h3>Choose the employee's new status</h3>
      <div className="decision-options">
        {DECISION_ORDER.map((code) => (
          <Button
            key={code}
            label={DECISION_LABELS[code].fr}
            outlined={state.decisionCode !== code}
            onClick={() => dispatch({ type: 'SELECT_DECISION', decisionCode: code })}
          />
        ))}
      </div>

      {state.decisionCode === 'ep' && (
        <div className="field">
          <label htmlFor="meetingDateTime">Meeting date &amp; time</label>
          <input
            id="meetingDateTime"
            type="datetime-local"
            className="p-inputtext"
            value={state.meetingDateTime ?? ''}
            onChange={(e) => dispatch({ type: 'SET_MEETING_DATETIME', value: e.target.value })}
          />
        </div>
      )}

      <div className="form-actions">
        <Button
          label="Next"
          disabled={!state.decisionCode || (state.decisionCode === 'ep' && !state.meetingDateTime)}
          onClick={onNext}
        />
      </div>
    </div>
  )
}
