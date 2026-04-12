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

export type MetricUnit = 'rub' | 'count' | 'percent' | 'avg_rub'

export interface MetricOption {
  key: string
  label: string
  unit: MetricUnit
  color: string
}

// Metrics matching real CSV column names from data sources
// These are the defaults — actual metric list is fetched from API (metric_definitions)
export const AVAILABLE_METRICS: MetricOption[] = [
  // Users data source
  { key: 'new_users', label: 'Новые пользователи', unit: 'count', color: '#3b82f6' },
  // Payments data sources
  { key: 'total_payments_count', label: 'Всего оплат', unit: 'count', color: '#f59e0b' },
  { key: 'payments_afterjoin_count', label: 'Оплаты после регистрации', unit: 'count', color: '#6366f1' },
  { key: 'payments_byguest_count', label: 'Оплаты от гостей', unit: 'count', color: '#ec4899' },
  { key: 'discounts_count', label: 'Скидок применено', unit: 'count', color: '#14b8a6' },
  { key: 'total_amount_gross', label: 'Выручка (gross)', unit: 'rub', color: '#10b981' },
  { key: 'total_amount_net', label: 'Выручка (net)', unit: 'rub', color: '#059669' },
  { key: 'avg_amount_gross', label: 'Средний чек (gross)', unit: 'avg_rub', color: '#8b5cf6' },
  { key: 'avg_amount_net', label: 'Средний чек (net)', unit: 'avg_rub', color: '#7c3aed' },
  { key: 'median_amount_gross', label: 'Медианный чек (gross)', unit: 'avg_rub', color: '#a78bfa' },
  { key: 'median_amount_net', label: 'Медианный чек (net)', unit: 'avg_rub', color: '#c4b5fd' },
]

export const DEFAULT_METRICS_BY_SOURCE: Record<string, string[]> = {
  new_users_daily: ['new_users'],
  new_users_weekly: ['new_users'],
  new_users_monthly: ['new_users'],
  new_payments_daily: ['total_payments_count', 'total_amount_gross', 'avg_amount_gross'],
  new_payments_weekly: ['total_payments_count', 'total_amount_gross', 'avg_amount_gross'],
  new_payments_monthly: ['total_payments_count', 'total_amount_gross', 'avg_amount_gross'],
  repeat_payments_daily: ['total_payments_count', 'total_amount_gross', 'avg_amount_gross'],
  repeat_payments_weekly: ['total_payments_count', 'total_amount_gross', 'avg_amount_gross'],
  repeat_payments_monthly: ['total_payments_count', 'total_amount_gross', 'avg_amount_gross'],
}
