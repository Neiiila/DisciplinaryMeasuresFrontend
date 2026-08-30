import { useEffect, useState } from 'react'
import { statisticsRepository } from '@/features/dashboard/api/statisticsRepository'
import { DecisionsBarChart } from '@/features/dashboard/components/DecisionsBarChart'
import { RequestsLineChart } from '@/features/dashboard/components/RequestsLineChart'
import { StatusDonutChart } from '@/features/dashboard/components/StatusDonutChart'
import type { DailyRequestCount, MonthlyDecisionCount, OverviewStatistics, StatusCount } from '@/features/dashboard/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

function startOfMonthIso(): string {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const toast = useToast()
  const [overview, setOverview] = useState<OverviewStatistics | null>(null)
  const [dailyRequests, setDailyRequests] = useState<DailyRequestCount[]>([])
  const [statusTotals, setStatusTotals] = useState<StatusCount[]>([])
  const [monthlyDecisions, setMonthlyDecisions] = useState<MonthlyDecisionCount[]>([])

  useEffect(() => {
    const year = new Date().getFullYear()
    Promise.all([
      statisticsRepository.getOverview(),
      statisticsRepository.getDailyRequests(startOfMonthIso(), todayIso()),
      statisticsRepository.getTotalRequestsByStatus(),
      statisticsRepository.getMonthlyDecisionCounts(year),
    ])
      .then(([overviewData, daily, statuses, monthly]) => {
        setOverview(overviewData)
        setDailyRequests(daily)
        setStatusTotals(statuses)
        setMonthlyDecisions(monthly)
      })
      .catch((error) => toast.error('Could not load statistics', getErrorMessage(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Overview</h1>
      </div>

      <div className="stat-tiles">
        <StatTile label="Employees" value={overview?.totalEmployees} icon="pi pi-id-card" />
        <StatTile label="Requests" value={overview?.totalRequests} icon="pi pi-shield" />
        <StatTile label="Meetings" value={overview?.totalMeetings} icon="pi pi-calendar" />
        <StatTile label="Users" value={overview?.totalUsers} icon="pi pi-users" />
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3>Requests this month</h3>
          <RequestsLineChart data={dailyRequests} />
        </div>
        <div className="card">
          <h3>Requests by outcome</h3>
          <StatusDonutChart data={statusTotals} />
        </div>
        <div className="card chart-grid-wide">
          <h3>Decisions per month</h3>
          <DecisionsBarChart data={monthlyDecisions} />
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, icon }: { label: string; value: number | undefined; icon: string }) {
  return (
    <div className="stat-tile">
      <i className={icon} />
      <div>
        <p className="stat-tile-value">{value ?? '—'}</p>
        <p className="stat-tile-label">{label}</p>
      </div>
    </div>
  )
}
