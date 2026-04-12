'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Eye, Database, CheckCircle2, XCircle } from 'lucide-react'
import { dataSourcesApi } from '@/lib/api'
import { DataSource } from '@/types/api'
import { useAuthStore } from '@/store/auth'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const CATEGORY_LABELS: Record<string, string> = {
  users: 'Пользователи',
  payments: 'Оплаты',
  retention: 'Удержание',
  traffic: 'Трафик',
  conversions: 'Конверсии',
  other: 'Другое',
}

const GRANULARITY_LABELS: Record<string, string> = {
  day: 'По дням',
  week: 'По неделям',
  month: 'По месяцам',
  custom: 'Произвольный',
}

export default function DataSourcesPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null)
  const [showSchemaDialog, setShowSchemaDialog] = useState(false)
  const isEditorOrAdmin = user?.role === 'admin' || user?.role === 'editor'

  const { data: sources = [], isLoading } = useQuery<DataSource[]>({
    queryKey: ['data-sources'],
    queryFn: () => dataSourcesApi.list(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      dataSourcesApi.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data-sources'] }),
  })

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try {
      return format(new Date(d), 'd MMM yyyy', { locale: ru })
    } catch {
      return d
    }
  }

  const handleViewSchema = (source: DataSource) => {
    setSelectedSource(source)
    setShowSchemaDialog(true)
  }

  return (
    <PageLayout title="Источники данных">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Реестр источников данных</CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Зарегистрированные источники CSV-данных и их схемы
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : sources.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <Database className="h-10 w-10 text-gray-300" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Нет источников данных</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Источники создаются автоматически при первом запуске (seed)
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Гранулярность</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead className="w-20">Схема</TableHead>
                    {isEditorOrAdmin && <TableHead className="w-20">Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((src) => (
                    <TableRow key={src.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{src.name}</p>
                          {src.description && (
                            <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                              {src.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {src.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[src.category || ''] || src.category || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {GRANULARITY_LABELS[src.granularity || ''] || src.granularity || '—'}
                      </TableCell>
                      <TableCell>
                        {src.is_active ? (
                          <div className="flex items-center gap-1.5 text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Активен</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Отключён</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(src.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleViewSchema(src)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Схема
                        </Button>
                      </TableCell>
                      {isEditorOrAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              toggleActiveMutation.mutate({ id: src.id, is_active: !src.is_active })
                            }
                            disabled={toggleActiveMutation.isPending}
                          >
                            {src.is_active ? 'Отключить' : 'Включить'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Schema viewer dialog */}
        <Dialog open={showSchemaDialog} onOpenChange={setShowSchemaDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Схема: {selectedSource?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedSource && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Slug</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono block">
                      {selectedSource.slug}
                    </code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Тип</p>
                    <p className="text-sm">{selectedSource.source_type || 'csv'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Колонки
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Поле CSV</TableHead>
                        <TableHead className="text-xs">Каноническое имя</TableHead>
                        <TableHead className="text-xs">Тип</TableHead>
                        <TableHead className="text-xs">Обязательное</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(selectedSource.column_mapping || {}).map(([csv, canonical]) => {
                        const schemaCol = (selectedSource.schema?.columns || []).find(
                          (c: any) => c.name === canonical
                        )
                        return (
                          <TableRow key={csv}>
                            <TableCell className="text-xs font-mono">{csv}</TableCell>
                            <TableCell className="text-xs font-mono text-blue-700">{canonical}</TableCell>
                            <TableCell className="text-xs">{schemaCol?.data_type || '—'}</TableCell>
                            <TableCell className="text-xs">
                              {schemaCol?.required ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <span className="text-gray-400">необязательное</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Mapping (JSON)
                  </p>
                  <pre className="text-xs bg-gray-50 border rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedSource.column_mapping, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSchemaDialog(false)}>Закрыть</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
