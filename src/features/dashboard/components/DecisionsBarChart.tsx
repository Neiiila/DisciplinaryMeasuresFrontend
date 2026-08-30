import Chart from 'react-apexcharts'
import type { MonthlyDecisionCount } from '@/features/dashboard/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function DecisionsBarChart({ data }: { data: MonthlyDecisionCount[] }) {
  const statuses = [...new Set(data.map((d) => d.status))]
  const series = statuses.map((status) => ({
    name: status,
    data: MONTHS.map((_, index) => data.find((d) => d.month === index + 1 && d.status === status)?.count ?? 0),
  }))

  return (
    <Chart
      type="bar"
      height={300}
      series={series}
      options={{
        chart: { stacked: true, toolbar: { show: false } },
        xaxis: { categories: MONTHS },
        plotOptions: { bar: { horizontal: false } },
      }}
    />
  )
}
