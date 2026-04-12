'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangeFilter } from './DateRangeFilter'
import { GranularityFilter } from './GranularityFilter'
import { MetricSelector } from './MetricSelector'
import { DashboardFilters, Granularity } from '@/types/dashboard'
import { DataSource } from '@/types/api'

interface FilterPanelProps {
  filters: DashboardFilters
  dataSources: DataSource[]
  onApply: (filters: DashboardFilters) => void
  onReset: () => void
}

export function FilterPanel({ filters, dataSources, onApply, onReset }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters)

  const handleApply = () => {
    onApply(localFilters)
  }

  const handleReset = () => {
    onReset()
  }

  return (
    <div className="print:hidden rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        {/* Data Source */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-gray-500">Набор данных</Label>
          <Select
            value={localFilters.data_source_id || '__all__'}
            onValueChange={(v) =>
              setLocalFilters((prev) => ({
                ...prev,
                data_source_id: v === '__all__' ? null : v,
              }))
            }
          >
            <SelectTrigger className="h-9 w-48 text-sm">
              <SelectValue placeholder="Все источники" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Все источники</SelectItem>
              {dataSources.map((ds) => (
                <SelectItem key={ds.id} value={ds.id}>
                  {ds.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <DateRangeFilter
          dateFrom={localFilters.date_from}
          dateTo={localFilters.date_to}
          onFromChange={(v) => setLocalFilters((prev) => ({ ...prev, date_from: v }))}
          onToChange={(v) => setLocalFilters((prev) => ({ ...prev, date_to: v }))}
        />

        {/* Granularity */}
        <GranularityFilter
          value={localFilters.granularity}
          onChange={(v: Granularity) => setLocalFilters((prev) => ({ ...prev, granularity: v }))}
        />

        {/* Metrics */}
        <MetricSelector
          value={localFilters.metrics}
          onChange={(v) => setLocalFilters((prev) => ({ ...prev, metrics: v }))}
        />

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={localFilters.metrics.length === 0}
          >
            Применить
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            Сбросить
          </Button>
        </div>
      </div>
    </div>
  )
}
