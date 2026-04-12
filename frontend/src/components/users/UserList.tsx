'use client'

import { User } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ShieldCheck, Eye, Edit2 } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { formatDateTime } from '@/lib/formatters'
import { getInitials } from '@/lib/utils'

interface UserListProps {
  users: User[]
  isLoading?: boolean
  currentUserId?: string
  onChangeRole?: (user: User, role: string) => void
  onDeactivate?: (user: User) => void
}

export function UserList({
  users,
  isLoading,
  currentUserId,
  onChangeRole,
  onDeactivate,
}: UserListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">Пользователей пока нет</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Пользователь</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Последний вход</TableHead>
          <TableHead>Дата добавления</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={ROLE_COLORS[user.role]}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.is_active ? 'success' : 'secondary'}>
                {user.is_active ? 'Активен' : 'Неактивен'}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {user.last_login ? formatDateTime(user.last_login) : 'Не входил'}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {formatDateTime(user.created_at)}
            </TableCell>
            <TableCell>
              {user.id !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onChangeRole?.(user, 'admin')}
                      className="gap-2"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Сделать администратором
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onChangeRole?.(user, 'editor')}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Сделать редактором
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onChangeRole?.(user, 'viewer')}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Сделать наблюдателем
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeactivate?.(user)}
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      Деактивировать
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
