import Chart from 'react-apexcharts'
import type { StatusCount } from '@/features/dashboard/types'

export function StatusDonutChart({ data }: { data: StatusCount[] }) {
  return (
    <Chart
      type="donut"
      height={300}
      series={data.map((d) => d.count)}
      options={{
        labels: data.map((d) => d.status),
        legend: { position: 'bottom' },
      }}
    />
  )
}
