'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AVAILABLE_METRICS } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface MetricSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function MetricSelector({ value, onChange }: MetricSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMetric = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((m) => m !== key))
    } else {
      onChange([...value, key])
    }
  }

  const removeMetric = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((m) => m !== key))
  }

  const selectedLabels = value
    .map((k) => AVAILABLE_METRICS.find((m) => m.key === k))
    .filter(Boolean)

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <Label className="text-xs text-gray-500">Метрики</Label>
      <div className="relative">
        <div
          className={cn(
            'flex min-h-[36px] w-52 cursor-pointer flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-1 text-sm',
            open && 'ring-2 ring-ring ring-offset-2'
          )}
          onClick={() => setOpen(!open)}
        >
          {selectedLabels.length === 0 && (
            <span className="text-muted-foreground text-sm">Выберите метрики</span>
          )}
          {selectedLabels.map((metric) =>
            metric ? (
              <Badge
                key={metric.key}
                variant="secondary"
                className="h-5 gap-1 py-0 pl-2 pr-1 text-xs"
              >
                {metric.label}
                <button
                  onClick={(e) => removeMetric(metric.key, e)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null
          )}
          <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0 opacity-50" />
        </div>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-1 shadow-lg">
            {AVAILABLE_METRICS.map((metric) => (
              <div
                key={metric.key}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                  value.includes(metric.key) && 'bg-accent/50'
                )}
                onClick={() => toggleMetric(metric.key)}
              >
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: metric.color }}
                />
                <span>{metric.label}</span>
                {value.includes(metric.key) && (
                  <span className="ml-auto text-xs text-muted-foreground">✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
