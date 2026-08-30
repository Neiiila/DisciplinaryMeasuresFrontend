import { Dialog } from 'primereact/dialog'
import { useEffect, useState } from 'react'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import type { Employee } from '@/features/employees/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

export function EmployeeDetailsDialog({
  employeeId,
  onHide,
}: {
  employeeId: string
  onHide: () => void
}) {
  const toast = useToast()
  const [employee, setEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    employeeRepository
      .getById(employeeId)
      .then(setEmployee)
      .catch((error) => toast.error('Could not load employee', getErrorMessage(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  return (
    <Dialog header="Employee details" visible onHide={onHide} style={{ width: '32rem' }}>
      {!employee ? (
        <p>Loading…</p>
      ) : (
        <dl className="details-grid">
          <dt>Id</dt>
          <dd>{employee.id}</dd>
          <dt>Name</dt>
          <dd>{employee.firstName} {employee.lastName}</dd>
          <dt>Email</dt>
          <dd>{employee.email}</dd>
          <dt>Phone</dt>
          <dd>{employee.phone}</dd>
          <dt>Position</dt>
          <dd>{employee.position}</dd>
          <dt>Department</dt>
          <dd>{employee.department}</dd>
          <dt>Business unit</dt>
          <dd>{employee.businessUnit}</dd>
          <dt>Site</dt>
          <dd>{employee.site}</dd>
          <dt>Hiring date</dt>
          <dd>{employee.hiringDate}</dd>
          <dt>Status</dt>
          <dd>{employee.status}</dd>
          <dt>Supervisor</dt>
          <dd>{employee.supervisor ?? '—'}</dd>
        </dl>
      )}
    </Dialog>
  )
}
