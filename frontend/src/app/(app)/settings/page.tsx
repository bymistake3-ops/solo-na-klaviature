'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { CheckCircle2, Info, Printer } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Просмотр',
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.name || '')
  const [saved, setSaved] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => usersApi.update(user!.id, { full_name: fullName }),
    onSuccess: (data) => {
      setUser(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  return (
    <PageLayout title="Настройки">
      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Профиль</CardTitle>
            <CardDescription>Ваши персональные данные</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">Email изменить нельзя</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Полное имя</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иван Иванов"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <div>
                <Badge variant="secondary">{ROLE_LABELS[user?.role || ''] || user?.role}</Badge>
              </div>
              <p className="text-xs text-gray-500">Роль назначается администратором</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !fullName.trim()}
              >
                {updateMutation.isPending ? 'Сохраняем...' : 'Сохранить'}
              </Button>
              {saved && (
                <div className="flex items-center gap-1.5 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Сохранено
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Print mode info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Печатная версия
            </CardTitle>
            <CardDescription>Как распечатать отчёт</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Любой дашборд можно распечатать или сохранить как PDF через браузер.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm">
              <li>Откройте нужный дашборд</li>
              <li>Настройте фильтры (период, метрики, гранулярность)</li>
              <li>Нажмите <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs border">Ctrl+P</kbd> (Windows) или <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs border">⌘+P</kbd> (Mac)</li>
              <li>Выберите формат «Сохранить как PDF» или принтер</li>
            </ol>
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                При печати боковое меню, фильтры и кнопки автоматически скрываются.
                Отображаются только данные, графики и таблицы.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About platform */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">О платформе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Версия</span>
              <span className="font-mono text-xs">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Платформа</span>
              <span>Аналитика СОЛО на клавиатуре</span>
            </div>
            <div className="flex justify-between">
              <span>API</span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                Swagger UI →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
