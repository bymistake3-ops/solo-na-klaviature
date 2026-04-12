'use client'

import { Printer, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  title: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const { user } = useAuthStore()

  const handlePrint = () => {
    window.print()
  }

  return (
    <header className="print:hidden flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        {actions}

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Печать
        </Button>

        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {getInitials(user.name)}
          </div>
        )}
      </div>
    </header>
  )
}
