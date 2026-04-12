'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AVAILABLE_METRICS } from '@/types/dashboard'

interface WidgetConfigProps {
  chartType: string
  metrics: string[]
  onSave: (chartType: string, metrics: string[]) => void
}

const CHART_TYPES = [
  { value: 'line', label: 'Линейный' },
  { value: 'bar', label: 'Столбчатый' },
  { value: 'area', label: 'Площадной' },
  { value: 'pie', label: 'Круговой' },
]

export function WidgetConfig({ chartType, metrics, onSave }: WidgetConfigProps) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState(chartType)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(metrics)

  const handleSave = () => {
    onSave(selectedType, selectedMetrics)
    setOpen(false)
  }

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-7 w-7"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Настройка виджета</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Тип графика</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Метрики</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_METRICS.map((metric) => (
                  <label
                    key={metric.key}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.key)}
                      onChange={() => toggleMetric(metric.key)}
                      className="rounded"
                    />
                    {metric.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={selectedMetrics.length === 0}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
