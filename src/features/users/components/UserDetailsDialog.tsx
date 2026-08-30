import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Tag } from 'primereact/tag'
import { useCallback, useEffect, useState } from 'react'
import { userRepository } from '@/features/users/api/userRepository'
import type { User } from '@/features/users/types'
import { toApiError } from '@/shared/api/apiError'
import { ACCOUNT_STATUSES, ROLE_LABELS } from '@/shared/config/roles'
import { toAbsoluteUrl } from '@/shared/config/env'
import { formatDate } from '@/shared/lib/formatDate'
import { useToast } from '@/shared/ui/ToastProvider'

export function UserDetailsDialog({
  userId,
  onHide,
  onChanged,
}: {
  userId: string
  onHide: () => void
  onChanged: () => void
}) {
  const toast = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setUser(await userRepository.getById(userId))
    } catch (error) {
      toast.error('Could not load the user', toApiError(error).message)
      onHide()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<void>, success: string, failure: string) {
    setIsBusy(true)
    try {
      await action()
      toast.success(success)
      onChanged()
      await load()
    } catch (error) {
      toast.error(failure, toApiError(error).message)
    } finally {
      setIsBusy(false)
    }
  }

  const photoUrl = toAbsoluteUrl(user?.photoPath)

  return (
    <Dialog header="User" visible onHide={onHide} style={{ width: '34rem' }} dismissableMask>
      {!user ? (
        <p>Loading…</p>
      ) : (
        <div className="details-stack">
          {photoUrl && <img className="user-photo" src={photoUrl} alt="" />}

          <dl className="details-grid">
            <dt>Matriculation</dt>
            <dd>{user.id}</dd>
            <dt>Name</dt>
            <dd>{user.fullName}</dd>
            <dt>Email</dt>
            <dd>{user.email ?? '—'}</dd>
            <dt>Phone</dt>
            <dd>{user.phoneNumber ?? '—'}</dd>
            <dt>Role</dt>
            <dd>{ROLE_LABELS[user.role]}</dd>
            <dt>Account</dt>
            <dd>{user.hasAccount ? <Tag value={user.accountStatus} /> : 'No sign-in account'}</dd>
            <dt>Supervisor</dt>
            <dd>{user.supervisorName ?? '—'}</dd>
            <dt>Position</dt>
            <dd>{user.employment.position ?? '—'}</dd>
            <dt>Department</dt>
            <dd>{user.employment.department ?? '—'}</dd>
            <dt>Business unit</dt>
            <dd>{user.employment.businessUnit ?? '—'}</dd>
            <dt>Hired</dt>
            <dd>{formatDate(user.employment.hiringDate)}</dd>
            <dt>Created</dt>
            <dd>{formatDate(user.createdOn)}</dd>
          </dl>

          {user.hasAccount && (
            <div className="form-actions">
              {user.accountStatus === ACCOUNT_STATUSES.PENDING && (
                <Button
                  label="Activate account"
                  icon="pi pi-check"
                  loading={isBusy}
                  onClick={() =>
                    run(
                      () => userRepository.activate(user.id),
                      'Account activated',
                      'Could not activate the account',
                    )
                  }
                />
              )}
              {user.accountStatus !== ACCOUNT_STATUSES.REVOKED && (
                <Button
                  label="Revoke access"
                  severity="danger"
                  outlined
                  loading={isBusy}
                  onClick={() =>
                    run(
                      () => userRepository.revokeAccount(user.id),
                      'Access revoked',
                      'Could not revoke access',
                    )
                  }
                />
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
