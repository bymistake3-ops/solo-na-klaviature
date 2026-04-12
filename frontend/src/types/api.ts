// ============================================================
// Types aligned with backend schemas (backend/app/schemas/)
// ============================================================

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  full_name: string | null
  // Convenience alias used in UI (mapped from full_name)
  name?: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
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

// Backend returns TokenResponse: { access_token, refresh_token, token_type, user }
export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface InviteToken {
  id: string
  token: string
  email?: string | null
  role: UserRole
  invited_by?: string | null
  used_by?: string | null
  used_at?: string | null
  expires_at: string
  is_active: boolean
  created_at: string
  invite_url?: string | null
}

export interface RegisterWithInviteRequest {
  token: string
  email: string
  password: string
  full_name?: string
}

export interface CreateInviteRequest {
  email?: string
  role: UserRole
  expires_in_days?: number
}

export interface DataSource {
  id: string
  name: string
  slug: string
  description?: string | null
  source_type: string
  schema: DataSourceSchemaConfig
  column_mapping: Record<string, string>
  granularity?: 'day' | 'week' | 'month' | 'custom' | null
  category?: string | null
  is_active: boolean
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface DataSourceSchemaConfig {
  columns: DataSourceColumn[]
}

export interface DataSourceColumn {
  name: string
  data_type: 'string' | 'integer' | 'float' | 'date' | 'boolean'
  required?: boolean
  description?: string
}

export interface Import {
  id: string
  data_source_id: string
  filename: string
  original_filename: string
  file_hash: string
  status: 'pending' | 'processing' | 'success' | 'error' | 'duplicate'
  row_count?: number | null
  error_message?: string | null
  imported_by?: string | null
  imported_at: string
  period_from?: string | null
  period_to?: string | null
}

export interface KPIData {
  metric?: string
  key: string
  name_ru: string
  name_en?: string | null
  value?: number | null
  unit?: string | null
  format_pattern?: string | null
  // Computed trend (not from backend, calculated on frontend)
  change_percent?: number
}

export interface ChartData {
  period: string
  [key: string]: string | number
}

export interface DashboardData {
  kpis: KPIData[]
  chart_data: ChartData[]
}

export interface FilterParams {
  data_source_id?: string
  date_from?: string
  date_to?: string
  granularity?: 'day' | 'week' | 'month'
  metrics?: string[]
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface MetricDefinition {
  id: string
  data_source_id?: string | null
  key: string
  name_ru: string
  name_en?: string | null
  description_ru?: string | null
  unit?: string | null
  data_type?: string | null
  aggregation?: string | null
  format_pattern?: string | null
  is_visible: boolean
  sort_order: number
}

export interface DimensionDefinition {
  id: string
  data_source_id?: string | null
  key: string
  name_ru: string
  name_en?: string | null
  data_type?: string | null
  is_filterable: boolean
  is_visible: boolean
}

export interface ApiError {
  detail: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}
