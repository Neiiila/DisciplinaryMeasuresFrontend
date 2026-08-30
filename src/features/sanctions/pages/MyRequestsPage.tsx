import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { ProgressBar } from 'primereact/progressbar'
import { Tag } from 'primereact/tag'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import { SanctionDetailsDialog } from '@/features/sanctions/components/SanctionDetailsDialog'
import { OUTCOME_LABELS, OUTCOME_SEVERITY, outcomeOf, progressPercent } from '@/features/sanctions/lib/sanctionStatus'
import type { SanctionRequest } from '@/features/sanctions/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

export function MyRequestsPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [requests, setRequests] = useState<SanctionRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  async function load() {
    if (!user) return
    setIsLoading(true)
    try {
      setRequests(await sanctionRepository.getMyRequests(user.userId))
    } catch (error) {
      toast.error('Could not load your requests', getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  return (
    <div className="page">
      <div className="page-header">
        <h1>My requests</h1>
      </div>

      <DataTable
        value={requests}
        loading={isLoading}
        paginator
        rows={10}
        dataKey="id"
        stripedRows
        onRowClick={(e) => setSelectedId((e.data as SanctionRequest).id)}
        selectionMode="single"
      >
        <Column field="employeeName" header="Employee" sortable />
        <Column field="faultTitle" header="Fault" sortable />
        <Column field="requestDate" header="Requested on" sortable />
        <Column
          header="Progress"
          body={(request: SanctionRequest) => (
            <ProgressBar value={progressPercent(request.validationLevel)} showValue={false} style={{ height: '0.6rem' }} />
          )}
        />
        <Column
          header="Outcome"
          body={(request: SanctionRequest) => {
            const outcome = outcomeOf(request.statuses.at(-1)?.status)
            return <Tag value={OUTCOME_LABELS[outcome]} severity={OUTCOME_SEVERITY[outcome]} />
          }}
        />
      </DataTable>

      {selectedId !== null && (
        <SanctionDetailsDialog
          sanctionId={selectedId}
          onHide={() => setSelectedId(null)}
          onChanged={load}
          allowResponse={false}
        />
      )}
    </div>
  )
}
