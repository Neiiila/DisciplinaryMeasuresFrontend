import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import { SanctionDetailsDialog } from '@/features/sanctions/components/SanctionDetailsDialog'
import { isFullyValidated } from '@/features/sanctions/lib/sanctionStatus'
import type { SanctionRequest } from '@/features/sanctions/types'
import { ROLES } from '@/shared/config/roles'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

/**
 * Mirrors the legacy `RecievedRequestsComponent`'s role split: an
 * HR-facing role (admin/superadmin) reviews fully-validated requests ready
 * for a decision, while a supervisor (chief) sees requests waiting on
 * their own approval.
 */
export function ReceivedRequestsPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const toast = useToast()
  const [requests, setRequests] = useState<SanctionRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const isHrReviewer = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN

  async function load() {
    if (!user) return
    setIsLoading(true)
    try {
      const data = isHrReviewer
        ? await sanctionRepository.getPreparedRequestsForRole(user.role, user.businessUnit)
        : await sanctionRepository.getReceivedRequests(user.userId)
      setRequests(data)
    } catch (error) {
      toast.error('Could not load requests', getErrorMessage(error))
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
        <h1>{isHrReviewer ? 'Prepared requests' : 'Received requests'}</h1>
      </div>

      <DataTable value={requests} loading={isLoading} paginator rows={10} dataKey="id" stripedRows>
        <Column field="employeeName" header="Employee" sortable />
        <Column field="faultTitle" header="Fault" sortable />
        <Column field="requestDate" header="Requested on" sortable />
        {!isHrReviewer && (
          <Column
            header="Status"
            body={(request: SanctionRequest) => (
              <Tag value={isFullyValidated(request) ? 'Fully validated' : 'Awaiting your review'} />
            )}
          />
        )}
        <Column
          header="Actions"
          body={(request: SanctionRequest) =>
            isHrReviewer ? (
              <Button
                label="Review decision"
                size="small"
                onClick={() => navigate(`/dashboard/sanctions/decision/${request.id}`)}
              />
            ) : (
              <Button label="View" size="small" text onClick={() => setSelectedId(request.id)} />
            )
          }
        />
      </DataTable>

      {selectedId !== null && (
        <SanctionDetailsDialog sanctionId={selectedId} onHide={() => setSelectedId(null)} onChanged={load} />
      )}
    </div>
  )
}
