'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { DashboardFilters, Granularity } from '@/types/dashboard'
import { format, subDays } from 'date-fns'

const DEFAULT_FILTERS: DashboardFilters = {
  data_source_id: null,
  date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  date_to: format(new Date(), 'yyyy-MM-dd'),
  granularity: 'day',
  metrics: ['new_users', 'gross_revenue', 'payments_count', 'avg_payment'],
}

export function useDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)

  const query = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () =>
      analyticsApi.getDashboard({
        data_source_id: filters.data_source_id || undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
        granularity: filters.granularity,
        metrics: filters.metrics,
      }),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const setGranularity = (granularity: Granularity) => {
    setFilters((prev) => ({ ...prev, granularity }))
  }

  const setDateRange = (from: string, to: string) => {
    setFilters((prev) => ({ ...prev, date_from: from, date_to: to }))
  }

  const setDataSource = (id: string | null) => {
    setFilters((prev) => ({ ...prev, data_source_id: id }))
  }

  const setMetrics = (metrics: string[]) => {
    setFilters((prev) => ({ ...prev, metrics }))
  }

  return {
    filters,
    updateFilters,
    resetFilters,
    setGranularity,
    setDateRange,
    setDataSource,
    setMetrics,
    ...query,
  }
}
