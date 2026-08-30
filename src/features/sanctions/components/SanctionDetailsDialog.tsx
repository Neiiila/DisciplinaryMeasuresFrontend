import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { Tag } from 'primereact/tag'
import { Timeline } from 'primereact/timeline'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import { parseAttachments } from '@/features/sanctions/lib/attachments'
import { OUTCOME_LABELS, OUTCOME_SEVERITY, outcomeOf } from '@/features/sanctions/lib/sanctionStatus'
import type { SanctionRequest } from '@/features/sanctions/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

export function SanctionDetailsDialog({
  sanctionId,
  onHide,
  onChanged,
  allowResponse = true,
}: {
  sanctionId: number
  onHide: () => void
  onChanged: () => void
  allowResponse?: boolean
}) {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [request, setRequest] = useState<SanctionRequest | null>(null)
  const [note, setNote] = useState('')
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    sanctionRepository
      .getById(sanctionId)
      .then(setRequest)
      .catch((error) => toast.error('Could not load request', getErrorMessage(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanctionId])

  const canRespond =
    allowResponse &&
    user &&
    request?.statuses.some((status) => status.validatorId === user.userId && status.status === null)

  async function respond(status: boolean) {
    if (!user) return
    setIsResponding(true)
    try {
      await sanctionRepository.respond({ sanctionId, validatorId: user.userId, status, note })
      toast.success(status ? 'Request approved' : 'Request rejected')
      onChanged()
      onHide()
    } catch (error) {
      toast.error('Could not submit response', getErrorMessage(error))
    } finally {
      setIsResponding(false)
    }
  }

  const attachments = parseAttachments(request?.attachments.join('||'))

  return (
    <Dialog header="Sanction request" visible onHide={onHide} style={{ width: '40rem' }}>
      {!request ? (
        <p>Loading…</p>
      ) : (
        <div className="details-stack">
          <dl className="details-grid">
            <dt>Employee</dt>
            <dd>{request.employeeName}</dd>
            <dt>Fault</dt>
            <dd>{request.faultTitle}</dd>
            <dt>Description</dt>
            <dd>{request.description}</dd>
            <dt>Requested on</dt>
            <dd>{request.requestDate}</dd>
          </dl>

          {attachments.length > 0 && (
            <div>
              <h4>Attachments</h4>
              <ul className="attachment-list">
                {attachments.map((attachment) => (
                  <li key={attachment.url}>
                    <a href={attachment.url} target="_blank" rel="noreferrer">
                      <i className={`pi pi-file`} /> {attachment.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4>Approval chain</h4>
            <Timeline
              value={request.statuses}
              content={(status) => {
                const outcome = outcomeOf(status.status)
                return (
                  <div>
                    <strong>{status.validatorName}</strong>{' '}
                    <Tag value={OUTCOME_LABELS[outcome]} severity={OUTCOME_SEVERITY[outcome]} />
                    {status.note && <p className="muted">{status.note}</p>}
                  </div>
                )
              }}
            />
          </div>

          {canRespond && (
            <div className="field">
              <label htmlFor="note">Note</label>
              <InputTextarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              <div className="form-actions">
                <Button label="Approve" icon="pi pi-check" loading={isResponding} onClick={() => respond(true)} />
                <Button
                  label="Reject"
                  icon="pi pi-times"
                  severity="danger"
                  outlined
                  loading={isResponding}
                  onClick={() => respond(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
