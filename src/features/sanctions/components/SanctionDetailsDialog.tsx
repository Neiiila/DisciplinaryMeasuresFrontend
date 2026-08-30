import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { Message } from 'primereact/message'
import { Tag } from 'primereact/tag'
import { Timeline } from 'primereact/timeline'
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import type { SanctionRequestDetail, Validation } from '@/features/sanctions/types'
import {
  DECISION_LABELS,
  DECISION_SEVERITY,
  STATE_LABELS,
  STATE_SEVERITY,
  isAwaiting,
  stateOf,
} from '@/features/sanctions/lib/sanctionStatus'
import { toApiError } from '@/shared/api/apiError'
import { VALIDATION_DECISIONS } from '@/shared/config/roles'
import { toAbsoluteUrl } from '@/shared/config/env'
import { formatDateTime } from '@/shared/lib/formatDate'
import { useToast } from '@/shared/ui/ToastProvider'

export function SanctionDetailsDialog({
  sanctionId,
  onHide,
  onChanged,
}: {
  sanctionId: number
  onHide: () => void
  onChanged: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [request, setRequest] = useState<SanctionRequestDetail | null>(null)
  const [note, setNote] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setRequest(await sanctionRepository.getById(sanctionId))
    } catch (error) {
      toast.error('Could not load request', toApiError(error).message)
      onHide()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanctionId])

  useEffect(() => {
    void load()
  }, [load])

  async function decide(decision: typeof VALIDATION_DECISIONS.APPROVED | typeof VALIDATION_DECISIONS.REFUSED) {
    setIsBusy(true)
    try {
      await sanctionRepository.recordDecision(sanctionId, decision, note.trim() || null)
      toast.success(decision === VALIDATION_DECISIONS.APPROVED ? 'Request approved' : 'Request refused')
      onChanged()
      onHide()
    } catch (error) {
      toast.error('Could not record your decision', toApiError(error).message)
    } finally {
      setIsBusy(false)
    }
  }

  async function cancel() {
    setIsBusy(true)
    try {
      await sanctionRepository.cancel(sanctionId)
      toast.success('Request cancelled')
      onChanged()
      onHide()
    } catch (error) {
      toast.error('Could not cancel the request', toApiError(error).message)
    } finally {
      setIsBusy(false)
    }
  }

  const canDecide = Boolean(user && request && isAwaiting(request, user.userId))
  const canCancel = Boolean(
    user && request && request.requesterId === user.userId && stateOf(request) === 'inProgress',
  )
  const attachmentUrl = toAbsoluteUrl(request?.attachmentPath)

  return (
    <Dialog header="Sanction request" visible onHide={onHide} style={{ width: '42rem' }} dismissableMask>
      {!request ? (
        <p>Loading…</p>
      ) : (
        <div className="details-stack">
          <div className="details-heading">
            <Tag value={STATE_LABELS[stateOf(request)]} severity={STATE_SEVERITY[stateOf(request)]} />
            <span className="muted">{request.progress.display} approvals</span>
          </div>

          <dl className="details-grid">
            <dt>Employee</dt>
            <dd>{request.employeeName ?? request.employeeId}</dd>
            <dt>Raised by</dt>
            <dd>{request.requesterName ?? request.requesterId}</dd>
            <dt>Raised on</dt>
            <dd>{formatDateTime(request.requestedOn)}</dd>
            <dt>Fault</dt>
            <dd>
              {request.fault ? (
                <>
                  {request.fault.title}
                  {!request.fault.isValidated && (
                    <Tag className="ml-2" value="Proposed" severity="warning" />
                  )}
                </>
              ) : (
                '—'
              )}
            </dd>
            <dt>Description</dt>
            <dd>{request.description}</dd>
            {request.details && (
              <>
                <dt>Details</dt>
                <dd>{request.details}</dd>
              </>
            )}
            {attachmentUrl && (
              <>
                <dt>Attachment</dt>
                <dd>
                  <a href={attachmentUrl} target="_blank" rel="noreferrer">
                    <i className="pi pi-paperclip" /> Open attachment
                  </a>
                </dd>
              </>
            )}
            {request.currentValidatorName && (
              <>
                <dt>Awaiting</dt>
                <dd>{request.currentValidatorName}</dd>
              </>
            )}
          </dl>

          <section>
            <h4>Decision history</h4>
            {request.validations.length === 0 ? (
              <p className="muted">No decisions recorded yet.</p>
            ) : (
              <Timeline
                value={request.validations}
                content={(validation: Validation) => (
                  <div className="timeline-entry">
                    <strong>{validation.validatorName ?? validation.validatorId}</strong>{' '}
                    <Tag
                      value={DECISION_LABELS[validation.decision]}
                      severity={DECISION_SEVERITY[validation.decision]}
                    />
                    <div className="muted">{formatDateTime(validation.decidedOn)}</div>
                    {validation.note && <p>{validation.note}</p>}
                  </div>
                )}
              />
            )}
          </section>

          {canDecide && (
            <section>
              <h4>Your decision</h4>
              <div className="field">
                <label htmlFor="note">Note (optional)</label>
                <InputTextarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>
              <div className="form-actions">
                <Button
                  label="Approve"
                  icon="pi pi-check"
                  loading={isBusy}
                  onClick={() => decide(VALIDATION_DECISIONS.APPROVED)}
                />
                <Button
                  label="Refuse"
                  icon="pi pi-times"
                  severity="danger"
                  outlined
                  loading={isBusy}
                  onClick={() => decide(VALIDATION_DECISIONS.REFUSED)}
                />
              </div>
            </section>
          )}

          {canCancel && (
            <section>
              <Message severity="info" text="You raised this request and can withdraw it while it is in progress." />
              <div className="form-actions">
                <Button label="Cancel request" severity="secondary" outlined loading={isBusy} onClick={cancel} />
              </div>
            </section>
          )}
        </div>
      )}
    </Dialog>
  )
}
