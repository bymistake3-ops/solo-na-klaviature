'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Database,
  Users,
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

const navItems = [
  {
    href: '/dashboard',
    label: 'Дашборды',
    icon: LayoutDashboard,
    roles: ['admin', 'editor', 'viewer'],
  },
  {
    href: '/uploads',
    label: 'Загрузка данных',
    icon: Upload,
    roles: ['admin', 'editor'],
  },
  {
    href: '/data-sources',
    label: 'Источники данных',
    icon: Database,
    roles: ['admin', 'editor'],
  },
  {
    href: '/users',
    label: 'Пользователи',
    icon: Users,
    roles: ['admin'],
  },
  {
    href: '/settings',
    label: 'Настройки',
    icon: Settings,
    roles: ['admin', 'editor', 'viewer'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const visibleItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  )

  return (
    <aside className="print:hidden flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Аналитика</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700 p-4">
        {user && (
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
