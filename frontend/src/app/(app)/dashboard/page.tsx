'use client'

import { useState, useEffect } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { KPICard, KPICardSkeleton } from '@/components/dashboard/KPICard'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, AlertCircle } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { useDataSources } from '@/hooks/useDataset'
import { DashboardFilters } from '@/types/dashboard'
import { ChartData } from '@/types/api'
import { formatMetricValue } from '@/lib/formatters'
import { AVAILABLE_METRICS } from '@/types/dashboard'

type SortKey = string
type SortDirection = 'asc' | 'desc'

export default function DashboardPage() {
  const {
    filters,
    data,
    isLoading,
    isError,
    error,
    updateFilters,
    resetFilters,
  } = useDashboard()

  const { data: dataSources = [] } = useDataSources()

  const [sortKey, setSortKey] = useState<SortKey>('period')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleApplyFilters = (newFilters: DashboardFilters) => {
    updateFilters(newFilters)
  }

  const sortedData = [...(data?.chart_data || [])].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    const aNum = Number(aVal) || 0
    const bNum = Number(bVal) || 0
    return sortDir === 'asc' ? aNum - bNum : bNum - aNum
  })

  const activeMetrics = filters.metrics
    .map((k) => AVAILABLE_METRICS.find((m) => m.key === k))
    .filter(Boolean)

  const kpiData = data?.kpis || []
  const primaryKPIs = ['new_users', 'gross_revenue', 'payments_count', 'avg_payment']
  const displayKPIs = kpiData.filter((k) => primaryKPIs.includes(k.metric))

  return (
    <PageLayout title="Аналитика">
      <div className="space-y-6">
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          dataSources={dataSources}
          onApply={handleApplyFilters}
          onReset={resetFilters}
        />

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Ошибка загрузки данных</p>
              <p className="text-xs mt-0.5 text-red-700">
                {error instanceof Error ? error.message : 'Не удалось получить данные'}
              </p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : displayKPIs.length > 0 ? (
            displayKPIs.map((kpi) => (
              <KPICard key={kpi.metric} data={kpi} />
            ))
          ) : !isError ? (
            // Mock KPI cards when no data but not erroring
            <div className="col-span-4 text-center py-8 text-gray-500 text-sm">
              Нет данных для выбранного периода и источника
            </div>
          ) : null}
        </div>

        {/* Charts Grid */}
        <div className="kpi-container">
          <DashboardGrid
            data={data?.chart_data || []}
            metrics={filters.metrics}
            isLoading={isLoading}
          />
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Детальные данные
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : sortedData.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Нет данных для отображения
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 gap-1"
                        onClick={() => handleSort('period')}
                      >
                        Период
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    {activeMetrics.map((metric) =>
                      metric ? (
                        <TableHead key={metric.key} className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleSort(metric.key)}
                          >
                            {metric.label}
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </Button>
                        </TableHead>
                      ) : null
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((row: ChartData, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.period}</TableCell>
                      {activeMetrics.map((metric) =>
                        metric ? (
                          <TableCell key={metric.key} className="text-right">
                            {formatMetricValue(Number(row[metric.key]) || 0, metric.unit)}
                          </TableCell>
                        ) : null
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
