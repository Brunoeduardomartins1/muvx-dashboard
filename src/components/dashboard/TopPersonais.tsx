'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { TopPersonal } from '@/lib/types'
import { fmtBRL, fmtNum } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { ExcelFilter } from '@/components/ui/ExcelFilter'

interface Props {
  topPersonals: TopPersonal[]
  isLoading?: boolean
}

type SortKey = 'personalName' | 'completedSales' | 'scheduledSales' | 'cancelledSales' | 'grossRevenue' | 'muvxRevenue'

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)) }

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ChevronUp size={10} style={{ opacity: 0.2 }} />
  return dir === 'asc' ? <ChevronUp size={10} style={{ color: '#08F887' }} /> : <ChevronDown size={10} style={{ color: '#08F887' }} />
}

function TopPersonaisSkeleton() {
  return (
    <div className="rounded-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="px-8 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Skeleton className="h-5 w-48 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="px-8 py-4 space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopPersonais({ topPersonals, isLoading }: Props) {
  const [fName, setFName] = useState(new Set<string>())
  const [sortKey, setSortKey] = useState<SortKey>('grossRevenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const nameOpts = useMemo(() => unique(topPersonals.map(p => p.personalName)).sort(), [topPersonals])

  const rows = useMemo(() => {
    const base = topPersonals.filter(p => fName.size === 0 || fName.has(p.personalName))
    return [...base].sort((a, b) => {
      const va = a[sortKey] as number | string
      const vb = b[sortKey] as number | string
      const cmp = typeof va === 'number' ? (va as number) - (vb as number) : (va as string).localeCompare(vb as string)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [topPersonals, fName, sortKey, sortDir])

  if (isLoading) return <TopPersonaisSkeleton />

  const thClass = "px-5 py-3 text-left cursor-pointer select-none"

  function Th({ col, label, filter }: { col: SortKey; label: string; filter?: React.ReactNode }) {
    return (
      <th className={thClass} style={{ minWidth: filter ? 130 : 90 }}>
        <button className="flex items-center gap-1 mb-1" onClick={() => toggleSort(col)}>
          <span className="text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
          <SortIcon col={col} sortKey={sortKey} dir={sortDir} />
        </button>
        {filter}
      </th>
    )
  }

  return (
    <div className="rounded-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
            Top Personais
          </h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ranking por receita gerada · top 10
          </p>
        </div>
        {rows.length !== topPersonals.length && (
          <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
            {rows.length} de {topPersonals.length}
          </span>
        )}
      </div>

      {topPersonals.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhuma venda registrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="px-5 py-3 text-left text-xs font-sans font-600 uppercase tracking-widest w-8" style={{ color: 'var(--text-muted)' }}>#</th>
                <Th col="personalName" label="Personal" filter={<ExcelFilter label="Personal" values={nameOpts} selected={fName} onChangeSelected={setFName} minWidth={140} />} />
                <Th col="completedSales" label="Concluídas" />
                <Th col="scheduledSales" label="Agendadas" />
                <Th col="cancelledSales" label="Canceladas" />
                <Th col="grossRevenue" label="Receita Bruta" />
                <Th col="muvxRevenue" label="Fat. MUVX" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr
                  key={p.personalId}
                  className="transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-5 py-3.5 text-sm font-grotesk font-700" style={{ color: i === 0 ? '#08F887' : 'var(--text-muted)' }}>
                    {i + 1}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-sans font-500 max-w-[160px] truncate" style={{ color: 'var(--text-primary)' }} title={p.personalName}>
                    {p.personalName}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-grotesk font-600" style={{ color: '#08F887' }}>
                    {fmtNum(p.completedSales)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-grotesk font-600" style={{ color: '#06B6D4' }}>
                    {fmtNum(p.scheduledSales)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-grotesk font-600" style={{ color: p.cancelledSales > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                    {fmtNum(p.cancelledSales)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {fmtBRL(p.grossRevenue)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: '#08F887' }}>
                    {fmtBRL(p.muvxRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
