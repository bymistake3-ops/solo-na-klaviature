'use client'

import { DashboardWidget } from './DashboardWidget'
import { ChartData } from '@/types/api'

interface DashboardGridProps {
  data: ChartData[]
  metrics: string[]
  isLoading?: boolean
}

// Groups of metrics by chart widget
const USERS_METRICS = ['new_users']
const REVENUE_METRICS = ['total_amount_gross', 'total_amount_net']
const PAYMENTS_METRICS = ['total_payments_count', 'payments_afterjoin_count', 'payments_byguest_count']
const AVG_METRICS = ['avg_amount_gross', 'avg_amount_net', 'median_amount_gross', 'median_amount_net']

export function DashboardGrid({ data, metrics, isLoading }: DashboardGridProps) {
  const usersMetrics = metrics.filter((m) => USERS_METRICS.includes(m))
  const revenueMetrics = metrics.filter((m) => REVENUE_METRICS.includes(m))
  const paymentsMetrics = metrics.filter((m) => PAYMENTS_METRICS.includes(m))
  const avgMetrics = metrics.filter((m) => AVG_METRICS.includes(m))

  // Determine which widgets to show
  const showUsers = usersMetrics.length > 0
  const showRevenue = revenueMetrics.length > 0
  const showPayments = paymentsMetrics.length > 0
  const showAvg = avgMetrics.length > 0

  // When loading, show placeholder widgets
  const showAny = isLoading || showUsers || showRevenue || showPayments || showAvg

  if (!showAny && !isLoading && data.length === 0) {
    return null
  }

  // Fallback when no specific metrics selected — pick first available metrics
  const allMetrics = metrics.length > 0 ? metrics : ['new_users']
  const fallbackMetrics = allMetrics.slice(0, 2)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {(showUsers || (isLoading && metrics.some((m) => USERS_METRICS.includes(m)))) && (
        <DashboardWidget
          title="Динамика новых пользователей"
          chart_type="line"
          metrics={usersMetrics}
          data={data}
          isLoading={isLoading}
        />
      )}
      {(showRevenue || (isLoading && metrics.some((m) => REVENUE_METRICS.includes(m)))) && (
        <DashboardWidget
          title="Выручка по периодам"
          chart_type="area"
          metrics={revenueMetrics}
          data={data}
          isLoading={isLoading}
        />
      )}
      {(showPayments || (isLoading && metrics.some((m) => PAYMENTS_METRICS.includes(m)))) && (
        <DashboardWidget
          title="Количество оплат"
          chart_type="bar"
          metrics={paymentsMetrics}
          data={data}
          isLoading={isLoading}
        />
      )}
      {showAvg && (
        <DashboardWidget
          title="Средний и медианный чек"
          chart_type="line"
          metrics={avgMetrics}
          data={data}
          isLoading={isLoading}
        />
      )}
      {/* When metrics don't fall into any category, show a generic chart */}
      {!showUsers && !showRevenue && !showPayments && !showAvg && metrics.length > 0 && (
        <DashboardWidget
          title="Динамика показателей"
          chart_type="line"
          metrics={fallbackMetrics}
          data={data}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
