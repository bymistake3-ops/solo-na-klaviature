export interface DatasetRow {
  id: string
  period: string
  data_source_id: string
  [key: string]: string | number | boolean | null
}

export interface DatasetStats {
  total_rows: number
  date_range: {
    min: string
    max: string
  }
  columns: ColumnStats[]
}

export interface ColumnStats {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  null_count: number
  unique_count: number
  min?: number | string
  max?: number | string
  avg?: number
}

export interface UploadResult {
  import_id: string
  file_name: string
  rows_total: number
  rows_imported: number
  rows_skipped: number
  status: 'success' | 'error' | 'partial'
  errors: UploadError[]
}

export interface UploadError {
  row: number
  column?: string
  message: string
}

export interface ColumnMapping {
  source_column: string
  target_field: string
  transform?: 'none' | 'to_number' | 'to_date' | 'to_boolean'
}
