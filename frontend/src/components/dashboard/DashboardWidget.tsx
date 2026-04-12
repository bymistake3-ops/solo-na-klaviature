'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricChart } from '@/components/charts/MetricChart'
import { ChartData } from '@/types/api'
import { ChartType } from '@/types/dashboard'

interface DashboardWidgetProps {
  title: string
  chart_type: ChartType
  metrics: string[]
  data: ChartData[]
  isLoading?: boolean
  height?: number
}

export function DashboardWidget({
  title,
  chart_type,
  metrics,
  data,
  isLoading,
  height = 280,
}: DashboardWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton style={{ height }} />
        ) : (
          <MetricChart
            chart_type={chart_type}
            metrics={metrics}
            data={data}
            height={height}
          />
        )}
      </CardContent>
    </Card>
  )
}
