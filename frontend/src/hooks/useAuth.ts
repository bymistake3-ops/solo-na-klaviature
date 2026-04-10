'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { getAccessToken } from '@/lib/auth'

export function useAuth() {
  const store = useAuthStore()
  return store
}

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !getAccessToken()) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

export function useRequireRole(requiredRoles: string[]) {
  const { user } = useAuthStore()
  return user ? requiredRoles.includes(user.role) : false
}
