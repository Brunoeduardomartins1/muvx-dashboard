'use client'

import { useState, useMemo } from 'react'
import { Download, ChevronUp, ChevronDown } from 'lucide-react'
import type { Purchase } from '@/lib/types'
import { fmtBRL, fmtDate, PAYMENT_METHOD_LABELS, STATUS_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ExcelFilter } from '@/components/ui/ExcelFilter'
import { exportPurchasesCsv } from '@/lib/exportCsv'

interface Props {
  purchases: Purchase[]
  isLoading?: boolean
}

type SortKey = 'studentName' | 'personalName' | 'planName' | 'amount' | 'status' | 'paymentMethod' | 'createdAt'

interface Filters {
  student: Set<string>; personal: Set<string>; plan: Set<string>
  amount: Set<string>; status: Set<string>; method: Set<string>; date: Set<string>
}
const EMPTY_F: Filters = { student: new Set(), personal: new Set(), plan: new Set(), amount: new Set(), status: new Set(), method: new Set(), date: new Set() }

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)) }

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ChevronUp size={11} style={{ opacity: 0.2 }} />
  return dir === 'asc' ? <ChevronUp size={11} style={{ color: '#08F887' }} /> : <ChevronDown size={11} style={{ color: '#08F887' }} />
}

export function DataTable({ purchases, isLoading }: Props) {
  const [f, setF] = useState<Filters>(EMPTY_F)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const set = (key: keyof Filters) => (s: Set<string>) => setF(prev => ({ ...prev, [key]: s }))

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const opts = useMemo(() => ({
    student: unique(purchases.map(p => p.studentName ?? '—')).sort(),
    personal: unique(purchases.map(p => p.personalName ?? '—')).sort(),
    plan: unique(purchases.map(p => p.planName ?? '—')).sort(),
    amount: unique(purchases.map(p => fmtBRL(p.amount))).sort(),
    status: unique(purchases.map(p => p.status)).sort(),
    method: unique(purchases.map(p => p.paymentMethod ?? '')).filter(Boolean).sort(),
    date: unique(purchases.map(p => fmtDate(p.createdAt))).sort(),
  }), [purchases])

  const filtered = useMemo(() => {
    let rows = purchases.filter(p => {
      if (f.student.size && !f.student.has(p.studentName ?? '—')) return false
      if (f.personal.size && !f.personal.has(p.personalName ?? '—')) return false
      if (f.plan.size && !f.plan.has(p.planName ?? '—')) return false
      if (f.amount.size && !f.amount.has(fmtBRL(p.amount))) return false
      if (f.status.size && !f.status.has(p.status)) return false
      if (f.method.size && !f.method.has(p.paymentMethod ?? '')) return false
      if (f.date.size && !f.date.has(fmtDate(p.createdAt))) return false
      return true
    })
    rows = [...rows].sort((a, b) => {
      let va: string | number = '', vb: string | number = ''
      if (sortKey === 'amount') { va = a.amount; vb = b.amount }
      else if (sortKey === 'createdAt') { va = a.createdAt ?? ''; vb = b.createdAt ?? '' }
      else if (sortKey === 'studentName') { va = a.studentName ?? ''; vb = b.studentName ?? '' }
      else if (sortKey === 'personalName') { va = a.personalName ?? ''; vb = b.personalName ?? '' }
      else if (sortKey === 'planName') { va = a.planName ?? ''; vb = b.planName ?? '' }
      else if (sortKey === 'status') { va = a.status; vb = b.status }
      else if (sortKey === 'paymentMethod') { va = a.paymentMethod ?? ''; vb = b.paymentMethod ?? '' }
      const cmp = typeof va === 'number' ? (va as number) - (vb as number) : (va as string).localeCompare(vb as string)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [purchases, f, sortKey, sortDir])

  if (isLoading) return <TableSkeleton />

  const thClass = "px-4 py-3 text-left cursor-pointer select-none"

  function Th({ col, label, filter }: { col: SortKey; label: string; filter: React.ReactNode }) {
    return (
      <th className={thClass} style={{ minWidth: 130 }}>
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
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>Compras Recentes</h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Top 100 do período · mostrando {filtered.length} de {purchases.length}
          </p>
        </div>
        <button
          onClick={() => exportPurchasesCsv(filtered)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-600 transition-colors"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#08F887'; e.currentTarget.style.color = '#08F887' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <Download size={12} /> CSV
        </button>
      </div>

      {purchases.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhuma compra no período selecionado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <tr>
                <Th col="studentName" label="Aluno" filter={<ExcelFilter label="" values={opts.student} selected={f.student} onChangeSelected={set('student')} minWidth={120} />} />
                <Th col="personalName" label="Personal" filter={<ExcelFilter label="" values={opts.personal} selected={f.personal} onChangeSelected={set('personal')} minWidth={120} />} />
                <Th col="planName" label="Plano" filter={<ExcelFilter label="" values={opts.plan} selected={f.plan} onChangeSelected={set('plan')} minWidth={110} />} />
                <Th col="amount" label="Valor" filter={<ExcelFilter label="" values={opts.amount} selected={f.amount} onChangeSelected={set('amount')} minWidth={90} />} />
                <Th col="status" label="Status" filter={
                  <ExcelFilter label="" values={opts.status.map(s => STATUS_LABELS[s] ?? s)} rawValues={opts.status} selected={f.status} onChangeSelected={set('status')} minWidth={110} />
                } />
                <Th col="paymentMethod" label="Método" filter={
                  <ExcelFilter label="" values={opts.method.map(m => PAYMENT_METHOD_LABELS[m] ?? m)} rawValues={opts.method} selected={f.method} onChangeSelected={set('method')} minWidth={100} />
                } />
                <Th col="createdAt" label="Data" filter={<ExcelFilter label="" values={opts.date} selected={f.date} onChangeSelected={set('date')} minWidth={90} />} />
              </tr>
            </thead>
            <tbody role="rowgroup">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhum resultado para os filtros aplicados.</td></tr>
              ) : filtered.map(p => (
                <tr
                  key={p.id}
                  className="transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3.5 text-sm font-sans font-500 max-w-[130px] truncate" style={{ color: 'var(--text-primary)' }} title={p.studentName ?? undefined}>{p.studentName ?? '—'}</td>
                  <td className="px-4 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.personalName ?? undefined}>{p.personalName ?? '—'}</td>
                  <td className="px-4 py-3.5 text-sm font-sans max-w-[120px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.planName ?? undefined}>{p.planName ?? '—'}</td>
                  <td className="px-4 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{fmtBRL(p.amount)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3.5 text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>{p.paymentMethod ? (PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod) : '—'}</td>
                  <td className="px-4 py-3.5 text-sm font-sans whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
