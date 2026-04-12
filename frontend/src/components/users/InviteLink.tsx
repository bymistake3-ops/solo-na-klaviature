'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InviteToken } from '@/types/api'
import { ROLE_LABELS } from '@/lib/auth'
import { formatDateTime } from '@/lib/formatters'

interface InviteLinkProps {
  invite: InviteToken
}

export function InviteLink({ invite }: InviteLinkProps) {
  const [copied, setCopied] = useState(false)

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${invite.token}`
      : `/invite/${invite.token}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800 mb-1">
          Приглашение создано!
        </p>
        <p className="text-xs text-green-700">
          Роль: <strong>{ROLE_LABELS[invite.role]}</strong>
          {invite.email && (
            <>
              {' '}· Email: <strong>{invite.email}</strong>
            </>
          )}
          <br />
          Истекает: {formatDateTime(invite.expires_at)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Ссылка для регистрации:</p>
        <div className="flex gap-2">
          <Input
            value={inviteUrl}
            readOnly
            className="font-mono text-xs"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Поделитесь этой ссылкой с пользователем. Ссылка действительна до{' '}
        {formatDateTime(invite.expires_at)}.
      </p>
    </div>
  )
}
