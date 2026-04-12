'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { KPIData } from '@/types/api'
import { formatMetricValue } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface KPICardProps {
  data: KPIData
  isLoading?: boolean
}

export function KPICard({ data, isLoading }: KPICardProps) {
  if (isLoading) {
    return <KPICardSkeleton />
  }

  const change = data.change_percent ?? 0
  const isPositive = change > 0
  const isNegative = change < 0
  const isZero = change === 0

  const metricKey = data.key || data.metric || ''
  // For churn-type metrics, positive is bad
  const isChurnMetric = metricKey.includes('churn') || metricKey.includes('отток')
  const isGood = isChurnMetric ? isNegative : isPositive
  const isBad = isChurnMetric ? isPositive : isNegative

  // Use name_ru from backend, fallback to key
  const label = data.name_ru || metricKey

  // Determine unit: backend returns string unit ('rub', 'count', etc.) or format_pattern
  const unit = (data.unit as 'rub' | 'count' | 'percent' | 'avg_rub') || 'count'
  const displayValue = data.value ?? null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-gray-500 mb-1 leading-tight">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-2">
          {displayValue !== null ? formatMetricValue(displayValue, unit) : '—'}
        </p>
        {data.change_percent !== undefined && (
          <div className="flex items-center gap-1">
            {isZero && <Minus className="h-4 w-4 text-gray-400" />}
            {isPositive && (
              <TrendingUp className={cn('h-4 w-4', isGood ? 'text-green-600' : 'text-red-600')} />
            )}
            {isNegative && (
              <TrendingDown className={cn('h-4 w-4', isBad ? 'text-red-600' : 'text-green-600')} />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isZero && 'text-gray-500',
                isGood && 'text-green-600',
                isBad && 'text-red-600'
              )}
            >
              {isZero ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
            </span>
            <span className="text-xs text-gray-400">vs предыдущий период</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  )
}
