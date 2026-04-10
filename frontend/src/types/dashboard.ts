export type ChartType = 'line' | 'bar' | 'area' | 'pie'
export type Granularity = 'day' | 'week' | 'month'

export interface Widget {
  id: string
  title: string
  chart_type: ChartType
  metrics: string[]
  width: 1 | 2 | 3 | 4
  height: 1 | 2
  order: number
}

export interface Dashboard {
  id: string
  title: string
  description?: string
  widgets: Widget[]
  created_at: string
  updated_at: string
}

export interface DashboardFilters {
  data_source_id: string | null
  date_from: string
  date_to: string
  granularity: Granularity
  metrics: string[]
}

export interface MetricOption {
  key: string
  label: string
  unit: 'rub' | 'count' | 'percent' | 'avg_rub'
  color: string
}

export const AVAILABLE_METRICS: MetricOption[] = [
  { key: 'new_users', label: 'Новые пользователи', unit: 'count', color: '#3b82f6' },
  { key: 'gross_revenue', label: 'Выручка (gross)', unit: 'rub', color: '#10b981' },
  { key: 'payments_count', label: 'Количество оплат', unit: 'count', color: '#f59e0b' },
  { key: 'avg_payment', label: 'Средний чек', unit: 'avg_rub', color: '#8b5cf6' },
  { key: 'active_users', label: 'Активные пользователи', unit: 'count', color: '#06b6d4' },
  { key: 'churn_rate', label: 'Отток пользователей', unit: 'percent', color: '#ef4444' },
  { key: 'conversion_rate', label: 'Конверсия', unit: 'percent', color: '#84cc16' },
  { key: 'net_revenue', label: 'Выручка (net)', unit: 'rub', color: '#14b8a6' },
]
