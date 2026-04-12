'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, BarChart3, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useInviteToken, useRegisterWithInvite } from '@/hooks/useMetrics'
import { useAuthStore } from '@/store/auth'
import { setTokens } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/auth'

const schema = z
  .object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function InvitePage({ params }: { params: { token: string } }) {
  const { token } = params
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { setUser } = useAuthStore()

  const { data: invite, isLoading, isError } = useInviteToken(token)
  const { mutate: register, isPending } = useRegisterWithInvite()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: invite?.email || '',
    },
  })

  // Pre-fill email when invite loads
  if (invite?.email) {
    setValue('email', invite.email)
  }

  const onSubmit = (data: FormData) => {
    setServerError(null)
    register(
      {
        token,
        email: data.email,
        name: data.name,
        password: data.password,
      },
      {
        onSuccess: (response) => {
          // Backend returns TokenResponse: { access_token, refresh_token, token_type, user }
          setTokens({
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: response.token_type,
          })
          setUser(response.user)
          router.push('/dashboard')
        },
        onError: (err) => {
          if (err instanceof Error) {
            setServerError(err.message)
          } else {
            setServerError('Ошибка при регистрации')
          }
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="bg-slate-900 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Аналитика</span>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="w-full max-w-md">
            <div className="rounded-xl border bg-white p-8 shadow-sm space-y-4">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isError || !invite) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="bg-slate-900 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Аналитика</span>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="w-full max-w-md text-center">
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Приглашение недействительно
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Эта ссылка-приглашение устарела, уже использована или не существует.
                Обратитесь к администратору для получения нового приглашения.
              </p>
              <Button onClick={() => router.push('/login')} variant="outline">
                Перейти ко входу
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (invite.used_at) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="bg-slate-900 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Аналитика</span>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="w-full max-w-md text-center">
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Приглашение уже использовано
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Это приглашение уже было использовано. Войдите в систему с вашей учётной записью.
              </p>
              <Button onClick={() => router.push('/login')}>
                Войти
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-slate-900 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            Аналитика
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl border bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
              <p className="mt-2 text-sm text-gray-500">
                Вас пригласили в систему аналитики
              </p>
            </div>

            {/* Role info */}
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                Вам будет назначена роль:{' '}
                <Badge className="bg-blue-100 text-blue-800 ml-1">
                  {ROLE_LABELS[invite.role]}
                </Badge>
              </p>
              {invite.email && (
                <p className="text-xs text-blue-700 mt-1">
                  Приглашение для: <strong>{invite.email}</strong>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Полное имя</Label>
                <Input
                  id="name"
                  placeholder="Иван Иванов"
                  {...registerField('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...registerField('email')}
                  readOnly={!!invite.email}
                  className={invite.email ? 'bg-gray-50' : errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Минимум 8 символов"
                    {...registerField('password')}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Повторите пароль"
                  {...registerField('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {serverError && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending} size="lg">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Уже есть учётная запись?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline"
            >
              Войти
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
