import { Message } from 'primereact/message'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { RequestsTrendChart } from '@/features/dashboard/components/RequestsTrendChart'
import { StateDonutChart } from '@/features/dashboard/components/StateDonutChart'
import { summarise, toMonthlyTrend, toStateBreakdown } from '@/features/dashboard/lib/summarise'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import type { SanctionRequestSummary } from '@/features/sanctions/types'
import { isAwaiting } from '@/features/sanctions/lib/sanctionStatus'
import { toApiError } from '@/shared/api/apiError'
import { ROLES } from '@/shared/config/roles'
import { useToast } from '@/shared/ui/ToastProvider'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const [requests, setRequests] = useState<SanctionRequestSummary[]>([])
  const [awaitingMe, setAwaitingMe] = useState<SanctionRequestSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAdministrator = user?.role === ROLES.ADMINISTRATOR

  useEffect(() => {
    if (!user) return

    // Administrators can see every request; everyone else only sees their own
    // and the ones routed to them, so the figures are scoped accordingly.
    const scope = isAdministrator
      ? sanctionRepository.getAll()
      : sanctionRepository.getMine()

    Promise.all([scope, sanctionRepository.getAddressedToMe()])
      .then(([scoped, addressed]) => {
        setRequests(scoped)
        setAwaitingMe(addressed.filter((request) => isAwaiting(request, user.userId)))
      })
      .catch((error) => toast.error('Could not load your dashboard', toApiError(error).message))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, isAdministrator])

  const summary = useMemo(() => summarise(requests), [requests])
  const breakdown = useMemo(() => toStateBreakdown(requests), [requests])
  const trend = useMemo(() => toMonthlyTrend(requests), [requests])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome{user ? `, ${user.displayName}` : ''}</h1>
      </div>

      {!isLoading && awaitingMe.length > 0 && (
        <Link to="/dashboard/sanctions/addressed-to-me" className="callout-link">
          <Message
            severity="warn"
            text={`${awaitingMe.length} request${awaitingMe.length === 1 ? '' : 's'} awaiting your decision`}
          />
        </Link>
      )}

      <div className="stat-tiles">
        <StatTile label={isAdministrator ? 'All requests' : 'My requests'} value={summary.total} icon="pi pi-folder" />
        <StatTile label="In progress" value={summary.inProgress} icon="pi pi-clock" />
        <StatTile label="Approved" value={summary.approved} icon="pi pi-check-circle" />
        <StatTile label="Refused" value={summary.refused} icon="pi pi-times-circle" />
      </div>

      {!isLoading && requests.length === 0 ? (
        <Message severity="info" text="No sanction requests yet." />
      ) : (
        <div className="chart-grid">
          <div className="card">
            <h3>Requests raised per month</h3>
            <RequestsTrendChart points={trend} />
          </div>
          <div className="card">
            <h3>By state</h3>
            <StateDonutChart slices={breakdown} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="stat-tile">
      <i className={icon} aria-hidden="true" />
      <div>
        <p className="stat-tile-value">{value}</p>
        <p className="stat-tile-label">{label}</p>
      </div>
    </div>
  )
}
