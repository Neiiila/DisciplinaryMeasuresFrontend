import Chart from 'react-apexcharts'
import type { DailyRequestCount } from '@/features/dashboard/types'

export function RequestsLineChart({ data }: { data: DailyRequestCount[] }) {
  const categories = [...new Set(data.map((d) => d.date))].sort()
  const businessUnits = [...new Set(data.map((d) => d.businessUnit).filter(Boolean))] as string[]

  const series =
    businessUnits.length > 0
      ? businessUnits.map((bu) => ({
          name: bu,
          data: categories.map((date) => data.find((d) => d.date === date && d.businessUnit === bu)?.count ?? 0),
        }))
      : [{ name: 'Requests', data: categories.map((date) => data.find((d) => d.date === date)?.count ?? 0) }]

  return (
    <Chart
      type="line"
      height={300}
      series={series}
      options={{
        chart: { toolbar: { show: false } },
        xaxis: { categories },
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false },
      }}
    />
  )
}
