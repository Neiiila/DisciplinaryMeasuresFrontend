import Chart from 'react-apexcharts'
import type { MonthlyPoint } from '@/features/dashboard/lib/summarise'

export function RequestsTrendChart({ points }: { points: MonthlyPoint[] }) {
  return (
    <Chart
      type="area"
      height={280}
      series={[{ name: 'Requests', data: points.map((point) => point.count) }]}
      options={{
        chart: { toolbar: { show: false }, fontFamily: 'inherit' },
        xaxis: { categories: points.map((point) => point.month) },
        yaxis: { labels: { formatter: (value) => String(Math.round(value)) } },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
        dataLabels: { enabled: false },
        colors: ['#4f46e5'],
        grid: { borderColor: '#e2e5ec', strokeDashArray: 4 },
      }}
    />
  )
}
