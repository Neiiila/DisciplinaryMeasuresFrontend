import { Button } from 'primereact/button'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import { SanctionDetailsDialog } from '@/features/sanctions/components/SanctionDetailsDialog'
import { SanctionRequestTable } from '@/features/sanctions/components/SanctionRequestTable'
import { useSanctionList } from '@/features/sanctions/hooks/useSanctionList'

/** Requests the signed-in user has raised. */
export function MyRequestsPage() {
  const fetcher = useCallback(() => sanctionRepository.getMine(), [])
  const { requests, isLoading, refresh } = useSanctionList(fetcher, 'Could not load your requests')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="page">
      <div className="page-header">
        <h1>My requests</h1>
        <Link to="/dashboard/sanctions/new">
          <Button label="Raise a request" icon="pi pi-plus" />
        </Link>
      </div>

      <SanctionRequestTable
        requests={requests}
        isLoading={isLoading}
        emptyMessage="You have not raised any requests."
        onSelect={(request) => setSelectedId(request.id)}
      />

      {selectedId !== null && (
        <SanctionDetailsDialog
          sanctionId={selectedId}
          onHide={() => setSelectedId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}
