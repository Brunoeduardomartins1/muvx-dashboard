'use client'

import useSWR from 'swr'
import { useEffect, useRef } from 'react'
import type { MetricsResponse } from '@/lib/types'

const ONE_HOUR = 60 * 60 * 1000
const THIRTY_MIN = 30 * 60 * 1000

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

export interface MetricsState {
  data: MetricsResponse | undefined
  isLoading: boolean
  isError: boolean
  lastUpdated: string | null
  refresh: () => void
}

export function useAutoRefresh(): MetricsState {
  const { data, error, isLoading, mutate } = useSWR<MetricsResponse>(
    '/api/metrics',
    fetcher,
    {
      refreshInterval: ONE_HOUR,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 30_000,
    }
  )

  const lastFetchedAtRef = useRef<string | null>(null)
  if (data?.fetchedAt) {
    lastFetchedAtRef.current = data.fetchedAt
  }

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        const lastAt = lastFetchedAtRef.current
        if (!lastAt) return
        const age = Date.now() - new Date(lastAt).getTime()
        if (age > THIRTY_MIN) mutate()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [mutate])

  return {
    data,
    isLoading,
    isError: !!error,
    lastUpdated: data?.fetchedAt ?? null,
    refresh: () => mutate(),
  }
}
