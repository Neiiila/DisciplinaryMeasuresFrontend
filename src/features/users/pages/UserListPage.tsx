import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { confirmDialog } from 'primereact/confirmdialog'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userRepository } from '@/features/users/api/userRepository'
import type { User } from '@/features/users/types'
import { UserDetailsDialog } from '@/features/users/components/UserDetailsDialog'
import { toApiError } from '@/shared/api/apiError'
import { ACCOUNT_STATUSES, ROLE_LABELS, type AccountStatus } from '@/shared/config/roles'
import { useToast } from '@/shared/ui/ToastProvider'

const STATUS_SEVERITY: Record<AccountStatus, 'success' | 'warning' | 'danger'> = {
  [ACCOUNT_STATUSES.ACTIVE]: 'success',
  [ACCOUNT_STATUSES.PENDING]: 'warning',
  [ACCOUNT_STATUSES.REVOKED]: 'danger',
}

export function UserListPage() {
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setUsers(await userRepository.getAll())
    } catch (error) {
      toast.error('Could not load users', toApiError(error).message)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<void>, success: string, failure: string) {
    try {
      await action()
      toast.success(success)
      await load()
    } catch (error) {
      toast.error(failure, toApiError(error).message)
    }
  }

  function confirmDelete(user: User) {
    confirmDialog({
      header: 'Remove user',
      message: `Hide ${user.fullName} from listings? The record is kept for audit.`,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () =>
        run(() => userRepository.softDelete(user.id), 'User removed', 'Could not remove the user'),
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <Link to="/dashboard/users/new">
          <Button label="Add user" icon="pi pi-plus" />
        </Link>
      </div>

      <DataTable value={users} loading={isLoading} paginator rows={10} dataKey="id" stripedRows>
        <Column field="id" header="Matriculation" sortable />
        <Column field="fullName" header="Name" sortable />
        <Column field="email" header="Email" sortable body={(user: User) => user.email ?? '—'} />
        <Column
          field="role"
          header="Role"
          sortable
          body={(user: User) => ROLE_LABELS[user.role]}
        />
        <Column
          field="accountStatus"
          header="Account"
          sortable
          body={(user: User) =>
            user.hasAccount ? (
              <Tag value={user.accountStatus} severity={STATUS_SEVERITY[user.accountStatus]} />
            ) : (
              <span className="muted">No account</span>
            )
          }
        />
        <Column
          header="Actions"
          body={(user: User) => (
            <div className="row-actions">
              <Button
                icon="pi pi-eye"
                text
                rounded
                aria-label={`View ${user.fullName}`}
                onClick={() => setSelectedId(user.id)}
              />
              <Link to={`/dashboard/users/${user.id}/edit`}>
                <Button icon="pi pi-pencil" text rounded aria-label={`Edit ${user.fullName}`} />
              </Link>
              {user.hasAccount && user.accountStatus === ACCOUNT_STATUSES.PENDING && (
                <Button
                  icon="pi pi-check-circle"
                  text
                  rounded
                  severity="success"
                  aria-label={`Activate ${user.fullName}`}
                  tooltip="Activate account"
                  onClick={() =>
                    run(
                      () => userRepository.activate(user.id),
                      'Account activated',
                      'Could not activate the account',
                    )
                  }
                />
              )}
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                aria-label={`Remove ${user.fullName}`}
                onClick={() => confirmDelete(user)}
              />
            </div>
          )}
        />
      </DataTable>

      {selectedId && (
        <UserDetailsDialog userId={selectedId} onHide={() => setSelectedId(null)} onChanged={load} />
      )}
    </div>
  )
}
