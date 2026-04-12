'use client'

import { MetricChart } from './MetricChart'
import { ChartData } from '@/types/api'

interface AreaChartProps {
  data: ChartData[]
  metrics: string[]
  height?: number
  title?: string
}

export function AppAreaChart({ data, metrics, height = 300, title }: AreaChartProps) {
  return (
    <div>
      {title && <h3 className="mb-4 text-sm font-medium text-gray-700">{title}</h3>}
      <MetricChart chart_type="area" metrics={metrics} data={data} height={height} />
    </div>
  )
}
