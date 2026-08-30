import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InputText } from 'primereact/inputtext'
import { useEffect, useMemo, useState } from 'react'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import type { UserSummary } from '@/features/users/types'
import { toApiError } from '@/shared/api/apiError'
import { useToast } from '@/shared/ui/ToastProvider'

/**
 * Read-only directory. Any authenticated user may browse it; editing a
 * person's record lives under Users and is administrator-only.
 */
export function EmployeeDirectoryPage() {
  const toast = useToast()
  const [employees, setEmployees] = useState<UserSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    employeeRepository
      .getAll()
      .then(setEmployees)
      .catch((error) => toast.error('Could not load the directory', toApiError(error).message))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return employees

    return employees.filter((employee) =>
      [employee.fullName, employee.id, employee.email, employee.department, employee.position]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term)),
    )
  }, [employees, search])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employee directory</h1>
        <span className="p-input-icon-left">
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search employees"
          />
        </span>
      </div>

      <DataTable
        value={filtered}
        loading={isLoading}
        paginator
        rows={15}
        dataKey="id"
        stripedRows
        emptyMessage="No employees match that search."
      >
        <Column field="id" header="Matriculation" sortable />
        <Column field="fullName" header="Name" sortable />
        <Column field="email" header="Email" body={(e: UserSummary) => e.email ?? '—'} />
        <Column field="position" header="Position" sortable body={(e: UserSummary) => e.position ?? '—'} />
        <Column field="department" header="Department" sortable body={(e: UserSummary) => e.department ?? '—'} />
      </DataTable>
    </div>
  )
}
