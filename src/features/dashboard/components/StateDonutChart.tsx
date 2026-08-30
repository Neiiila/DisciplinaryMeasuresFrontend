import Chart from 'react-apexcharts'
import type { StateSlice } from '@/features/dashboard/lib/summarise'

/** Colours are keyed to the state labels so a slice keeps its colour as counts change. */
const SLICE_COLOURS: Record<string, string> = {
  'In progress': '#f59e0b',
  Approved: '#16a34a',
  Refused: '#dc2626',
  Cancelled: '#94a3b8',
}

export function StateDonutChart({ slices }: { slices: StateSlice[] }) {
  return (
    <Chart
      type="donut"
      height={280}
      series={slices.map((slice) => slice.value)}
      options={{
        chart: { fontFamily: 'inherit' },
        labels: slices.map((slice) => slice.label),
        colors: slices.map((slice) => SLICE_COLOURS[slice.label] ?? '#4f46e5'),
        legend: { position: 'bottom' },
        dataLabels: { enabled: true },
        stroke: { width: 0 },
      }}
    />
  )
}
