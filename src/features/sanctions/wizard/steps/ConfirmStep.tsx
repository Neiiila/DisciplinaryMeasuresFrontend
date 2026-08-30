import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import type { SanctionRequest } from '@/features/sanctions/types'
import { useDecisionWizardDispatch, useDecisionWizardState } from '@/features/sanctions/wizard/DecisionWizardContext'
import { DECISION_LABELS } from '@/features/sanctions/pdf/decisionLabels'
import { useSanctionLetterPdf } from '@/features/sanctions/pdf/useSanctionLetterPdf'
import { SanctionLetterTemplate } from '@/features/sanctions/pdf/SanctionLetterTemplate'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

export function ConfirmStep({ request, onBack }: { request: SanctionRequest; onBack: () => void }) {
  const state = useDecisionWizardState()
  const dispatch = useDecisionWizardDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const { templateRef, generate } = useSanctionLetterPdf()
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!state.decisionCode) return null
  const decision = DECISION_LABELS[state.decisionCode]

  async function submit() {
    if (!state.decisionCode) return
    setIsSubmitting(true)
    try {
      const date = new Date().toISOString().slice(0, 10)
      const file = await generate({
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        faultTitleAr: request.faultTitle,
        decisionCode: state.decisionCode,
        date,
      })

      if (state.decisionCode === 'ep' && state.meetingDateTime) {
        await sanctionRepository.addMeeting(request.id, state.meetingDateTime, state.sendByEmail, file)
      } else {
        await sanctionRepository.addDecision(
          { sanctionId: request.id, employeeNewStatus: state.decisionCode, decisionDate: date },
          state.sendByEmail,
          file,
        )
      }

      if (state.sendByWhatsapp && whatsappNumber) {
        await sanctionRepository.sendViaWhatsapp(
          whatsappNumber,
          `${decision.fr} — ${request.employeeName}`,
          file,
        )
      }

      if (state.downloadCopy) {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
      }

      toast.success('Decision recorded')
      navigate('/dashboard/sanctions/received')
    } catch (error) {
      toast.error('Could not finalize the decision', getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="wizard-step">
      <h3>Confirm</h3>
      <p>
        <strong>{request.employeeName}</strong> will receive: <strong>{decision.fr}</strong>
      </p>

      <div className="field checkbox-field">
        <Checkbox
          inputId="sendByEmail"
          checked={state.sendByEmail}
          onChange={() => dispatch({ type: 'TOGGLE_SEND_OPTION', option: 'sendByEmail' })}
        />
        <label htmlFor="sendByEmail">Send by email</label>
      </div>

      <div className="field checkbox-field">
        <Checkbox
          inputId="sendByWhatsapp"
          checked={state.sendByWhatsapp}
          onChange={() => dispatch({ type: 'TOGGLE_SEND_OPTION', option: 'sendByWhatsapp' })}
        />
        <label htmlFor="sendByWhatsapp">Send via WhatsApp</label>
      </div>
      {state.sendByWhatsapp && (
        <div className="field">
          <label htmlFor="whatsappNumber">WhatsApp number</label>
          <InputText
            id="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 212600000000"
          />
        </div>
      )}

      <div className="field checkbox-field">
        <Checkbox
          inputId="downloadCopy"
          checked={state.downloadCopy}
          onChange={() => dispatch({ type: 'TOGGLE_SEND_OPTION', option: 'downloadCopy' })}
        />
        <label htmlFor="downloadCopy">Download a copy</label>
      </div>

      <div className="pdf-offscreen">
        <SanctionLetterTemplate
          ref={templateRef}
          data={{
            employeeId: request.employeeId,
            employeeName: request.employeeName,
            faultTitleAr: request.faultTitle,
            decisionCode: state.decisionCode,
            date: new Date().toISOString().slice(0, 10),
          }}
        />
      </div>

      <div className="form-actions">
        <Button label="Back" outlined onClick={onBack} />
        <Button label="Confirm decision" loading={isSubmitting} onClick={submit} />
      </div>
    </div>
  )
}
