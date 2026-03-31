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
    <div
      className="card rounded-card p-8 h-full"
      style={{ minHeight: 300 }}
    >
      <div className="mb-4">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Status de Compras
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Distribuição por status no período
        </p>
      </div>
      <div style={{ height: 220 }}>
        <BarChartInner purchasesByStatus={purchasesByStatus} />
      </div>
    </div>
  )
}
