'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, invitesApi } from '@/lib/api'
import { CreateInviteRequest, RegisterWithInviteRequest } from '@/types/api'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn: () => invitesApi.list(),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInviteRequest) => invitesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })
}

export function useRevokeInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invitesApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })
}

export function useInviteToken(token: string) {
  return useQuery({
    queryKey: ['invite-token', token],
    queryFn: () => invitesApi.getByToken(token),
    enabled: !!token,
    retry: false,
  })
}

export function useRegisterWithInvite() {
  return useMutation({
    mutationFn: (data: RegisterWithInviteRequest) => invitesApi.register(data),
  })
}
