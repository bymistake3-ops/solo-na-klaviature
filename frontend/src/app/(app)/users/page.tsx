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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { UserPlus, Copy, Check, Trash2, AlertCircle, Link2 } from 'lucide-react'
import { usersApi, invitesApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { User, InviteToken } from '@/types/api'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Просмотр',
}

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  editor: 'secondary',
  viewer: 'outline',
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer')
  const [createdInvite, setCreatedInvite] = useState<InviteToken | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  })

  const { data: invites = [], isLoading: loadingInvites } = useQuery<InviteToken[]>({
    queryKey: ['invites'],
    queryFn: () => invitesApi.list(),
  })

  const createInviteMutation = useMutation({
    mutationFn: () => invitesApi.create({ email: inviteEmail || undefined, role: inviteRole }),
    onSuccess: (data) => {
      setCreatedInvite(data)
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })

  const revokeInviteMutation = useMutation({
    mutationFn: (id: string) => invitesApi.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites'] }),
  })

  const deactivateUserMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const handleCreateInvite = () => {
    createInviteMutation.mutate()
  }

  const handleCopyLink = async () => {
    if (!createdInvite) return
    const link = `${window.location.origin}/invite/${createdInvite.token}`
    await navigator.clipboard.writeText(link)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const handleCloseDialog = () => {
    setInviteDialogOpen(false)
    setCreatedInvite(null)
    setInviteEmail('')
    setInviteRole('viewer')
  }

  const getInviteLink = (token: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: ru })
    } catch {
      return dateStr
    }
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <PageLayout title="Пользователи">
      <div className="space-y-6">
        {/* Users table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Пользователи платформы</CardTitle>
            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
                if (!open) handleCloseDialog()
                else setInviteDialogOpen(true)
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Пригласить
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Пригласить пользователя</DialogTitle>
                  </DialogHeader>

                  {!createdInvite ? (
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="invite-email">Email (необязательно)</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="user@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Если не указать — создаётся ссылка для любого пользователя
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Роль</Label>
                        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Просмотр</SelectItem>
                            <SelectItem value="editor">Редактор</SelectItem>
                            <SelectItem value="admin">Администратор</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Отмена</Button>
                        <Button
                          onClick={handleCreateInvite}
                          disabled={createInviteMutation.isPending}
                        >
                          {createInviteMutation.isPending ? 'Создаём...' : 'Создать ссылку'}
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <div className="space-y-4 py-2">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                        <p className="text-sm font-medium text-green-800 mb-1">Ссылка создана!</p>
                        <p className="text-xs text-green-700">
                          Роль: <strong>{ROLE_LABELS[createdInvite.role]}</strong>
                          {createdInvite.email && ` • Email: ${createdInvite.email}`}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Ссылка-приглашение</Label>
                        <div className="flex gap-2">
                          <Input
                            value={getInviteLink(createdInvite.token)}
                            readOnly
                            className="text-xs font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyLink}
                          >
                            {copiedToken ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Ссылка действует 7 дней и может быть использована однократно
                        </p>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCloseDialog}>Закрыть</Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата добавления</TableHead>
                    {isAdmin && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{u.name || u.email}</p>
                          {u.name && <p className="text-xs text-gray-500">{u.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE_VARIANT[u.role] || 'outline'}>
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'default' : 'secondary'}>
                          {u.is_active ? 'Активен' : 'Деактивирован'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(u.created_at)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {u.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600"
                              onClick={() => {
                                if (confirm(`Деактивировать пользователя ${u.email}?`)) {
                                  deactivateUserMutation.mutate(u.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Invite links */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Ссылки-приглашения
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingInvites ? (
                <div className="p-6 space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : invites.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Нет активных ссылок-приглашений
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Истекает</TableHead>
                      <TableHead>Создана</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-sm">
                          {inv.email || <span className="text-gray-400 italic">любой</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ROLE_BADGE_VARIANT[inv.role] || 'outline'} className="text-xs">
                            {ROLE_LABELS[inv.role] || inv.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inv.used_at ? (
                            <Badge variant="secondary" className="text-xs">Использована</Badge>
                          ) : inv.is_active ? (
                            <Badge variant="default" className="text-xs bg-green-600">Активна</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Отозвана</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(inv.expires_at)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(inv.created_at)}
                        </TableCell>
                        <TableCell>
                          {inv.is_active && !inv.used_at && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600"
                              onClick={() => {
                                if (confirm('Отозвать эту ссылку?')) {
                                  revokeInviteMutation.mutate(inv.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
