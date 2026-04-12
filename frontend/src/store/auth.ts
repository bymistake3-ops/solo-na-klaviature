import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types/api'
import { clearTokens, setTokens } from '@/lib/auth'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

function normalizeUser(u: User): User {
  return { ...u, name: u.full_name || u.email }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user: user ? normalizeUser(user) : null, isAuthenticated: !!user })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          // Backend returns { access_token, refresh_token, token_type, user }
          const response = await authApi.login({ email, password })
          setTokens({
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: response.token_type,
          })
          set({
            user: normalizeUser(response.user),
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // Ignore errors on logout
        } finally {
          clearTokens()
          set({ user: null, isAuthenticated: false })
        }
      },

      fetchMe: async () => {
        set({ isLoading: true })
        try {
          const user = await authApi.me()
          set({ user: normalizeUser(user), isAuthenticated: true, isLoading: false })
        } catch {
          clearTokens()
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
