export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface InviteToken {
  id: string
  token: string
  email?: string
  role: 'admin' | 'editor' | 'viewer'
  created_by: string
  created_at: string
  expires_at: string
  used_at?: string
  is_used: boolean
}

export interface RegisterWithInviteRequest {
  token: string
  email: string
  name: string
  password: string
}

export interface CreateInviteRequest {
  email?: string
  role: 'admin' | 'editor' | 'viewer'
}

export interface DataSource {
  id: string
  name: string
  description?: string
  schema: DataSourceSchema[]
  created_at: string
  updated_at: string
  created_by: string
}

export interface DataSourceSchema {
  column_name: string
  column_type: 'string' | 'number' | 'date' | 'boolean'
  mapped_field?: string
  is_required: boolean
}

export interface Import {
  id: string
  file_name: string
  data_source_id: string
  data_source_name: string
  status: 'success' | 'processing' | 'error' | 'duplicate'
  rows_total: number
  rows_imported: number
  period_start?: string
  period_end?: string
  error_message?: string
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
}

export interface MetricData {
  period: string
  value: number
  metric: string
}

export interface KPIData {
  metric: string
  value: number
  previous_value?: number
  change_percent?: number
  unit: 'rub' | 'count' | 'percent' | 'avg_rub'
}

export interface ChartData {
  period: string
  [key: string]: string | number
}

export interface DashboardData {
  kpis: KPIData[]
  chart_data: ChartData[]
  metrics: string[]
}

export interface FilterParams {
  data_source_id?: string
  date_from: string
  date_to: string
  granularity: 'day' | 'week' | 'month'
  metrics: string[]
}

export interface ApiError {
  detail: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}
