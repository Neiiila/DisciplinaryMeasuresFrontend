import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import type { Meeting } from '@/features/sanctions/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

export function MeetingListPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    sanctionRepository
      .getMeetingsForRole(user.role, user.businessUnit)
      .then(setMeetings)
      .catch((error) => toast.error('Could not load meetings', getErrorMessage(error)))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Meetings</h1>
      </div>

      <DataTable value={meetings} loading={isLoading} paginator rows={10} dataKey="id" stripedRows>
        <Column field="employeeName" header="Employee" sortable />
        <Column field="faultTitle" header="Related fault" sortable />
        <Column field="meetingDate" header="Scheduled for" sortable />
      </DataTable>
    </div>
  )
}
