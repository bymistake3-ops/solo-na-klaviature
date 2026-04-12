'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/auth'
import { getAccessToken } from '@/lib/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.push('/login')
      return
    }
    if (!isAuthenticated) {
      fetchMe()
    }
  }, [isAuthenticated, fetchMe, router])

  const token = getAccessToken()
  if (!token && !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden print:flex-1">
        {children}
      </div>
    </div>
  )
}
