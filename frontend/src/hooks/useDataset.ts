'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataSourcesApi, importsApi } from '@/lib/api'
import { DataSource } from '@/types/api'

export function useDataSources() {
  return useQuery({
    queryKey: ['data-sources'],
    queryFn: () => dataSourcesApi.list(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDataSource(id: string) {
  return useQuery({
    queryKey: ['data-sources', id],
    queryFn: () => dataSourcesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateDataSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<DataSource, 'id' | 'created_at' | 'updated_at' | 'created_by'>) =>
      dataSourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] })
    },
  })
}

export function useUpdateDataSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DataSource> }) =>
      dataSourcesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] })
    },
  })
}

export function useDeleteDataSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dataSourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] })
    },
  })
}

export function useImports() {
  return useQuery({
    queryKey: ['imports'],
    queryFn: () => importsApi.list(),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.items.some((i) => i.status === 'processing')) {
        return 3000
      }
      return false
    },
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      dataSourceId,
      onProgress,
    }: {
      file: File
      dataSourceId: string
      onProgress?: (percent: number) => void
    }) => importsApi.upload(file, dataSourceId, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports'] })
    },
  })
}
