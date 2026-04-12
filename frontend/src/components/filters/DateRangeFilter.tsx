'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface DateRangeFilterProps {
  dateFrom: string
  dateTo: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onFromChange,
  onToChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-gray-500">с</Label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-9 w-36 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-gray-500">по</Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onToChange(e.target.value)}
          className="h-9 w-36 text-sm"
        />
      </div>
    </div>
  )
}
