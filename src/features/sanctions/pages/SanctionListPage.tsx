import { useCallback, useState } from 'react'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import { SanctionDetailsDialog } from '@/features/sanctions/components/SanctionDetailsDialog'
import { SanctionRequestTable } from '@/features/sanctions/components/SanctionRequestTable'
import { useSanctionList } from '@/features/sanctions/hooks/useSanctionList'

/** Every request in the system. Administrators only. */
export function SanctionListPage() {
  const fetcher = useCallback(() => sanctionRepository.getAll(), [])
  const { requests, isLoading, refresh } = useSanctionList(fetcher, 'Could not load sanction requests')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="page">
      <div className="page-header">
        <h1>All sanction requests</h1>
      </div>

      <SanctionRequestTable
        requests={requests}
        isLoading={isLoading}
        showRequester
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
