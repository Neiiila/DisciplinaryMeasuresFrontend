import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useEffect, useState } from 'react'
import { userRepository } from '@/features/users/api/userRepository'
import type { UserAccount } from '@/features/users/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
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
  const [account, setAccount] = useState<UserAccount | null>(null)

  useEffect(() => {
    userRepository
      .getById(userId)
      .then(setAccount)
      .catch((error) => toast.error('Could not load account', getErrorMessage(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function verify() {
    try {
      await userRepository.verifyAccount(userId)
      toast.success('Account verified')
      onChanged()
      onHide()
    } catch (error) {
      toast.error('Verification failed', getErrorMessage(error))
    }
  }

  return (
    <Dialog header="Account details" visible onHide={onHide} style={{ width: '32rem' }}>
      {!account ? (
        <p>Loading…</p>
      ) : (
        <>
          <dl className="details-grid">
            <dt>Id</dt>
            <dd>{account.id}</dd>
            <dt>Name</dt>
            <dd>{account.firstName} {account.lastName}</dd>
            <dt>Email</dt>
            <dd>{account.email}</dd>
            <dt>Role</dt>
            <dd>{account.role}</dd>
            <dt>Status</dt>
            <dd>{account.accountStatus}</dd>
          </dl>
          <div className="form-actions">
            <Button label="Verify account" icon="pi pi-check" onClick={verify} />
          </div>
        </>
      )}
    </Dialog>
  )
}
