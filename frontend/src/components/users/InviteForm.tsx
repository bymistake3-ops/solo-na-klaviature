'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { useCreateInvite } from '@/hooks/useMetrics'
import { InviteToken } from '@/types/api'

const schema = z.object({
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  role: z.enum(['admin', 'editor', 'viewer']),
})

type FormData = z.infer<typeof schema>

interface InviteFormProps {
  onSuccess: (invite: InviteToken) => void
}

export function InviteForm({ onSuccess }: InviteFormProps) {
  const { mutate: createInvite, isPending, isError, error } = useCreateInvite()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'viewer', email: '' },
  })

  const onSubmit = (data: FormData) => {
    createInvite(
      {
        email: data.email || undefined,
        role: data.role,
      },
      {
        onSuccess: (invite) => {
          onSuccess(invite)
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email (необязательно)</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Если указан email, ссылка будет привязана к этому адресу
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Роль</Label>
        <Select
          defaultValue="viewer"
          onValueChange={(v) => setValue('role', v as 'admin' | 'editor' | 'viewer')}
        >
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Администратор</SelectItem>
            <SelectItem value="editor">Редактор</SelectItem>
            <SelectItem value="viewer">Просмотр</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error instanceof Error ? error.message : 'Ошибка при создании приглашения'}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Создание...' : 'Создать приглашение'}
      </Button>
    </form>
  )
}
