'use client'

import dynamic from 'next/dynamic'
import { RingSkeleton } from '@/components/ui/Skeleton'

const ConversionRingInner = dynamic(() => import('./ConversionRingInner'), {
  ssr: false,
  loading: () => <RingSkeleton />,
})

interface Props {
  rate: number
  isLoading?: boolean
}

export function ConversionRing({ rate, isLoading }: Props) {
  if (isLoading) return <RingSkeleton />

  return (
    <div className="rounded-card p-8 bg-surface border border-border card-hover h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-grotesk font-700 text-base text-text">Taxa de Conversão</h3>
        <p className="text-xs font-sans text-text-muted mt-0.5">Compras pagas / total do período</p>
      </div>
      <div className="flex-1" style={{ minHeight: 160 }}>
        <ConversionRingInner rate={rate} />
      </div>
    </div>
  )
}
