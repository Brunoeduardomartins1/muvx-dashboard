'use client'

import { useState, useMemo } from 'react'
import type { Purchase } from '@/lib/types'
import { fmtBRL, fmtDate, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ExcelFilter } from '@/components/ui/ExcelFilter'

interface Props {
  purchases: Purchase[]
  isLoading?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluído', ACTIVE: 'Ativo', SCHEDULED: 'Agendado',
  CANCELLED: 'Cancelado', CANCELLED_BY_STUDENT: 'Canc. aluno',
  CANCELLED_BY_PERSONAL: 'Canc. personal', PENDING: 'Pendente',
}

interface Filters {
  student: Set<string>
  personal: Set<string>
  plan: Set<string>
  amount: Set<string>
  status: Set<string>
  method: Set<string>
  date: Set<string>
}

const EMPTY: Filters = {
  student: new Set(), personal: new Set(), plan: new Set(),
  amount: new Set(), status: new Set(), method: new Set(), date: new Set(),
}

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)) }

export function DataTable({ purchases, isLoading }: Props) {
  const [f, setF] = useState<Filters>(EMPTY)
  const set = (key: keyof Filters) => (s: Set<string>) => setF(prev => ({ ...prev, [key]: s }))

  // unique sorted values per column
  const opts = useMemo(() => ({
    student: unique(purchases.map(p => p.studentName ?? '—').filter(Boolean)).sort(),
    personal: unique(purchases.map(p => p.personalName ?? '—').filter(Boolean)).sort(),
    plan: unique(purchases.map(p => p.planName ?? '—').filter(Boolean)).sort(),
    amount: unique(purchases.map(p => fmtBRL(p.amount))).sort(),
    status: unique(purchases.map(p => p.status)).sort(),
    method: unique(purchases.map(p => p.paymentMethod ?? '')).filter(Boolean).sort(),
    date: unique(purchases.map(p => fmtDate(p.createdAt))).sort(),
  }), [purchases])

  const filtered = useMemo(() => purchases.filter(p => {
    if (f.student.size && !f.student.has(p.studentName ?? '—')) return false
    if (f.personal.size && !f.personal.has(p.personalName ?? '—')) return false
    if (f.plan.size && !f.plan.has(p.planName ?? '—')) return false
    if (f.amount.size && !f.amount.has(fmtBRL(p.amount))) return false
    if (f.status.size && !f.status.has(p.status)) return false
    if (f.method.size && !f.method.has(p.paymentMethod ?? '')) return false
    if (f.date.size && !f.date.has(fmtDate(p.createdAt))) return false
    return true
  }), [purchases, f])

  if (isLoading) return <TableSkeleton />

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="px-8 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Compras Recentes
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Top 100 do período · mostrando {filtered.length} de {purchases.length}
        </p>
      </div>

      {purchases.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhuma compra no período selecionado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                <th className="px-4 py-3 text-left" style={{ minWidth: 140 }}>
                  <ExcelFilter label="Aluno" values={opts.student} selected={f.student} onChangeSelected={set('student')} />
                </th>
                <th className="px-4 py-3 text-left" style={{ minWidth: 140 }}>
                  <ExcelFilter label="Personal" values={opts.personal} selected={f.personal} onChangeSelected={set('personal')} />
                </th>
                <th className="px-4 py-3 text-left" style={{ minWidth: 130 }}>
                  <ExcelFilter label="Plano" values={opts.plan} selected={f.plan} onChangeSelected={set('plan')} />
                </th>
                <th className="px-4 py-3 text-left" style={{ minWidth: 100 }}>
                  <ExcelFilter label="Valor" values={opts.amount} selected={f.amount} onChangeSelected={set('amount')} />
                </th>
                <th className="px-4 py-3 text-left" style={{ minWidth: 120 }}>
                  <ExcelFilter
                    label="Status"
                    values={opts.status.map(s => STATUS_LABELS[s] ?? s)}
                    rawValues={opts.status}
                    selected={f.status}
                    onChangeSelected={set('status')}
                  />
                </th>
                <th className="px-4 py-3 text-left" style={{ minWidth: 110 }}>
                  <ExcelFilter
                    label="Método"
                    values={opts.method.map(m => PAYMENT_METHOD_LABELS[m] ?? m)}
                    rawValues={opts.method}
                    selected={f.method}
                    onChangeSelected={set('method')}
                  />
                </th>
                <th className="px-4 py-3 text-left" style={{ minWidth: 100 }}>
                  <ExcelFilter label="Data" values={opts.date} selected={f.date} onChangeSelected={set('date')} />
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
                    Nenhum resultado para os filtros aplicados.
                  </td>
                </tr>
              ) : filtered.map((p) => (
                <tr
                  key={p.id}
                  role="row"
                  className="transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3.5 text-sm font-sans font-500 max-w-[140px] truncate" style={{ color: 'var(--text-primary)' }} title={p.studentName ?? undefined}>
                    {p.studentName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-sans max-w-[140px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.personalName ?? undefined}>
                    {p.personalName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.planName ?? undefined}>
                    {p.planName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {fmtBRL(p.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>
                    {p.paymentMethod ? (PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-sans whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {fmtDate(p.createdAt)}
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
