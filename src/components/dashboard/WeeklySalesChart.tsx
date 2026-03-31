'use client'

import dynamic from 'next/dynamic'
import type { WeekdaySales } from '@/lib/types'
import { Skeleton } from '@/components/ui/Skeleton'

const WeeklySalesInner = dynamic(() => import('./WeeklySalesInner'), { ssr: false })

interface Props {
  data: WeekdaySales[]
  isLoading?: boolean
}

export function WeeklySalesChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-52 mb-2" />
        <Skeleton className="h-3 w-36 mb-6" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  const peakDay = data.reduce((max, d) => d.count > max.count ? d : max, data[0])

  return (
    <div className="card rounded-card p-8">
      <div className="mb-6">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Vendas por Dia da Semana
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {peakDay?.count > 0 ? `Pico: ${peakDay.day} com ${peakDay.count} vendas` : 'Distribuição de vendas no período'}
        </p>
      </div>
      <div style={{ height: 160 }}>
        <WeeklySalesInner data={data} />
      </div>
    </div>
  )
}
