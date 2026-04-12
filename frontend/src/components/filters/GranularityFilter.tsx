'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Granularity } from '@/types/dashboard'
import { Label } from '@/components/ui/label'

interface GranularityFilterProps {
  value: Granularity
  onChange: (value: Granularity) => void
}

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'По дням' },
  { value: 'week', label: 'По неделям' },
  { value: 'month', label: 'По месяцам' },
]

export function GranularityFilter({ value, onChange }: GranularityFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-gray-500">Гранулярность</Label>
      <Tabs value={value} onValueChange={(v) => onChange(v as Granularity)}>
        <TabsList className="h-9">
          {GRANULARITY_OPTIONS.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value} className="text-xs px-3">
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
