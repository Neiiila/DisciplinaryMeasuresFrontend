import { confirmDialog } from 'primereact/confirmdialog'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import type { Employee } from '@/features/employees/types'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'
import { EmployeeDetailsDialog } from '@/features/employees/components/EmployeeDetailsDialog'

export function EmployeeListPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  async function load() {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await employeeRepository.getForRole(user.role, user.businessUnit)
      setEmployees([...data].sort((a, b) => a.lastName.localeCompare(b.lastName)))
    } catch (error) {
      toast.error('Could not load employees', getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  function confirmDelete(employee: Employee) {
    confirmDialog({
      message: `Delete ${employee.firstName} ${employee.lastName}? This cannot be undone.`,
      header: 'Confirm deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await employeeRepository.remove(employee.id)
          toast.success('Employee deleted')
          load()
        } catch (error) {
          toast.error('Deletion failed', getErrorMessage(error))
        }
      },
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employees</h1>
        <Link to="/dashboard/employees/new">
          <Button label="Add employee" icon="pi pi-plus" />
        </Link>
      </div>

      <DataTable value={employees} loading={isLoading} paginator rows={10} dataKey="id" stripedRows>
        <Column field="id" header="Id" sortable />
        <Column
          header="Name"
          sortable
          field="lastName"
          body={(employee: Employee) => `${employee.firstName} ${employee.lastName}`}
        />
        <Column field="department" header="Department" sortable />
        <Column field="position" header="Position" sortable />
        <Column field="businessUnit" header="Business unit" sortable />
        <Column field="status" header="Status" sortable />
        <Column
          header="Actions"
          body={(employee: Employee) => (
            <div className="row-actions">
              <Button
                icon="pi pi-eye"
                text
                rounded
                onClick={() => setSelectedEmployeeId(employee.id)}
                aria-label="View details"
              />
              <Link to={`/dashboard/employees/${employee.id}/edit`}>
                <Button icon="pi pi-pencil" text rounded aria-label="Edit" />
              </Link>
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                onClick={() => confirmDelete(employee)}
                aria-label="Delete"
              />
            </div>
          )}
        />
      </DataTable>

      {selectedEmployeeId && (
        <EmployeeDetailsDialog employeeId={selectedEmployeeId} onHide={() => setSelectedEmployeeId(null)} />
      )}
    </div>
  )
}
