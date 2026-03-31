'use client'

import dynamic from 'next/dynamic'
import { ChartSkeleton } from '@/components/ui/Skeleton'

const BarChartInner = dynamic(() => import('./BarChartInner'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})

interface Props {
  purchasesByStatus: Record<string, number>
  isLoading?: boolean
}

export function BarChartComponent({ purchasesByStatus, isLoading }: Props) {
  if (isLoading) return <ChartSkeleton />

  return (
    <div className="rounded-card p-8 bg-surface border border-border card-hover h-full">
      <div className="mb-4">
        <h3 className="font-grotesk font-700 text-base text-text">Status de Compras</h3>
        <p className="text-xs font-sans text-text-muted mt-0.5">Distribuição por status no período</p>
      </div>
      <div style={{ height: 200 }}>
        <BarChartInner purchasesByStatus={purchasesByStatus} />
      </div>
    </div>
  )
}
