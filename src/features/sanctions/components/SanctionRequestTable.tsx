import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { ProgressBar } from 'primereact/progressbar'
import { Tag } from 'primereact/tag'
import type { SanctionRequestSummary } from '@/features/sanctions/types'
import { STATE_LABELS, STATE_SEVERITY, progressPercent, stateOf } from '@/features/sanctions/lib/sanctionStatus'
import { formatDate } from '@/shared/lib/formatDate'

/**
 * The one table used by all three request lists (all / mine / addressed to
 * me). The legacy app had four near-identical table components that had
 * drifted apart in their status labels and progress rendering; the columns
 * that genuinely differ between lists are toggled by prop instead.
 */
export function SanctionRequestTable({
  requests,
  isLoading,
  onSelect,
  showEmployee = true,
  showRequester = false,
  emptyMessage = 'No requests to show.',
}: {
  requests: SanctionRequestSummary[]
  isLoading: boolean
  onSelect: (request: SanctionRequestSummary) => void
  showEmployee?: boolean
  showRequester?: boolean
  emptyMessage?: string
}) {
  return (
    <DataTable
      value={requests}
      loading={isLoading}
      paginator
      rows={10}
      dataKey="id"
      stripedRows
      emptyMessage={emptyMessage}
      selectionMode="single"
      onRowClick={(event) => onSelect(event.data as SanctionRequestSummary)}
    >
      {showEmployee && <Column field="employeeName" header="Employee" sortable />}
      {showRequester && <Column field="requesterName" header="Raised by" sortable />}
      <Column field="faultTitle" header="Fault" sortable body={(r: SanctionRequestSummary) => r.faultTitle ?? '—'} />
      <Column field="description" header="Description" />
      <Column
        field="requestedOn"
        header="Raised on"
        sortable
        body={(request: SanctionRequestSummary) => formatDate(request.requestedOn)}
      />
      <Column
        header="Approvals"
        body={(request: SanctionRequestSummary) => (
          <div className="progress-cell">
            <ProgressBar
              value={progressPercent(request.progress)}
              showValue={false}
              style={{ height: '0.5rem' }}
            />
            <small>{request.progress.display}</small>
          </div>
        )}
      />
      <Column
        header="State"
        body={(request: SanctionRequestSummary) => {
          const state = stateOf(request)
          return <Tag value={STATE_LABELS[state]} severity={STATE_SEVERITY[state]} />
        }}
      />
    </DataTable>
  )
}
