'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { TopStudent } from '@/lib/types'
import { fmtBRL, fmtNum } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { ExcelFilter } from '@/components/ui/ExcelFilter'

interface Props {
  topStudents: TopStudent[]
  isLoading?: boolean
}

type SortKey = 'studentName' | 'purchasesCount' | 'totalSpent'

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)) }

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ChevronUp size={10} style={{ opacity: 0.2 }} />
  return dir === 'asc' ? <ChevronUp size={10} style={{ color: '#08F887' }} /> : <ChevronDown size={10} style={{ color: '#08F887' }} />
}

export function TopStudents({ topStudents, isLoading }: Props) {
  const [fName, setFName] = useState(new Set<string>())
  const [sortKey, setSortKey] = useState<SortKey>('totalSpent')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const nameOpts = useMemo(() => unique(topStudents.map(s => s.studentName)).sort(), [topStudents])

  const rows = useMemo(() => {
    const base = topStudents.filter(s => fName.size === 0 || fName.has(s.studentName))
    return [...base].sort((a, b) => {
      const va = a[sortKey] as number | string
      const vb = b[sortKey] as number | string
      const cmp = typeof va === 'number' ? (va as number) - (vb as number) : (va as string).localeCompare(vb as string)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [topStudents, fName, sortKey, sortDir])

  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card rounded-card p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
            Top Alunos por Gasto
          </h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Alunos com maior valor em compras concluídas no período
          </p>
        </div>
        {rows.length !== topStudents.length && (
          <span className="text-xs font-sans flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {rows.length} de {topStudents.length}
          </span>
        )}
      </div>

      {/* Filtro de nome */}
      <div className="mb-4">
        <ExcelFilter label="Aluno" values={nameOpts} selected={fName} onChangeSelected={setFName} minWidth={160} />
      </div>

      {topStudents.length === 0 ? (
        <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Sem dados no período.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhum resultado para os filtros aplicados.</p>
      ) : (
        <>
          {/* Header ordenável */}
          <div className="flex items-center gap-3 mb-2 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span className="w-5 flex-shrink-0" />
            <button className="flex-1 flex items-center gap-1 text-left" onClick={() => toggleSort('studentName')}>
              <span className="text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Aluno</span>
              <SortIcon col="studentName" sortKey={sortKey} dir={sortDir} />
            </button>
            <button className="flex items-center gap-1 flex-shrink-0" onClick={() => toggleSort('purchasesCount')}>
              <span className="text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Qtd</span>
              <SortIcon col="purchasesCount" sortKey={sortKey} dir={sortDir} />
            </button>
            <button className="flex items-center gap-1 flex-shrink-0" onClick={() => toggleSort('totalSpent')}>
              <span className="text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</span>
              <SortIcon col="totalSpent" sortKey={sortKey} dir={sortDir} />
            </button>
          </div>

          <div className="space-y-2">
            {rows.map((s, i) => (
              <div key={s.studentId} className="flex items-center gap-3 py-1">
                <span
                  className="w-5 text-xs font-grotesk font-700 text-right flex-shrink-0"
                  style={{ color: i === 0 ? '#08F887' : 'var(--text-muted)' }}
                >
                  {i + 1}
                </span>
                <span
                  className="flex-1 text-sm font-sans font-500 truncate"
                  style={{ color: 'var(--text-primary)' }}
                  title={s.studentName}
                >
                  {s.studentName}
                </span>
                <span className="text-xs font-sans flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {fmtNum(s.purchasesCount)}x
                </span>
                <span className="text-sm font-grotesk font-700 flex-shrink-0" style={{ color: '#08F887' }}>
                  {fmtBRL(s.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
