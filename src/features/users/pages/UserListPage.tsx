import { confirmDialog } from 'primereact/confirmdialog'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { userRepository } from '@/features/users/api/userRepository'
import type { AccountStatus, UserAccount } from '@/features/users/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'
import { UserDetailsDialog } from '@/features/users/components/UserDetailsDialog'

const STATUS_SEVERITY: Record<AccountStatus, 'success' | 'warning' | 'danger' | 'secondary'> = {
  Active: 'success',
  Inactive: 'warning',
  Blocked: 'danger',
  Deleted: 'secondary',
}

export function UserListPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [users, setUsers] = useState<UserAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load() {
    if (!user) return
    setIsLoading(true)
    try {
      setUsers(await userRepository.getForRole(user.role, user.businessUnit))
    } catch (error) {
      toast.error('Could not load users', getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  function confirmDelete(account: UserAccount) {
    confirmDialog({
      message: `Permanently delete ${account.firstName} ${account.lastName}'s account?`,
      header: 'Confirm deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await userRepository.delete(account.id)
          toast.success('Account deleted')
          load()
        } catch (error) {
          toast.error('Deletion failed', getErrorMessage(error))
        }
      },
    })
  }

  function confirmSoftRemove(account: UserAccount) {
    confirmDialog({
      message: `Deactivate ${account.firstName} ${account.lastName}'s account?`,
      header: 'Confirm deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await userRepository.softRemove(account.id)
          toast.success('Account deactivated')
          load()
        } catch (error) {
          toast.error('Action failed', getErrorMessage(error))
        }
      },
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <Link to="/dashboard/users/new">
          <Button label="Attach account" icon="pi pi-plus" />
        </Link>
      </div>

      <DataTable value={users} loading={isLoading} paginator rows={10} dataKey="id" stripedRows>
        <Column field="id" header="Id" sortable />
        <Column
          header="Name"
          sortable
          field="lastName"
          body={(account: UserAccount) => `${account.firstName} ${account.lastName}`}
        />
        <Column field="email" header="Email" sortable />
        <Column field="role" header="Role" sortable />
        <Column
          header="Status"
          field="accountStatus"
          sortable
          body={(account: UserAccount) => (
            <Tag value={account.accountStatus} severity={STATUS_SEVERITY[account.accountStatus]} />
          )}
        />
        <Column
          header="Actions"
          body={(account: UserAccount) => (
            <div className="row-actions">
              <Button icon="pi pi-eye" text rounded onClick={() => setSelectedId(account.id)} aria-label="Details" />
              <Link to={`/dashboard/users/${account.id}/edit`}>
                <Button icon="pi pi-pencil" text rounded aria-label="Edit" />
              </Link>
              <Button
                icon="pi pi-ban"
                text
                rounded
                severity="warning"
                onClick={() => confirmSoftRemove(account)}
                aria-label="Deactivate"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                onClick={() => confirmDelete(account)}
                aria-label="Delete"
              />
            </div>
          )}
        />
      </DataTable>

      {selectedId && <UserDetailsDialog userId={selectedId} onHide={() => setSelectedId(null)} onChanged={load} />}
    </div>
  )
}
