'use client'

import { MetricChart } from './MetricChart'
import { ChartData } from '@/types/api'

interface LineChartProps {
  data: ChartData[]
  metrics: string[]
  height?: number
  title?: string
}

export function AppLineChart({ data, metrics, height = 300, title }: LineChartProps) {
  return (
    <div>
      {title && <h3 className="mb-4 text-sm font-medium text-gray-700">{title}</h3>}
      <MetricChart chart_type="line" metrics={metrics} data={data} height={height} />
    </div>
  )
}
