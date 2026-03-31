'use client'

import { useState, useMemo } from 'react'
import type { Purchase } from '@/lib/types'
import { fmtBRL, fmtDate, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'

interface Props {
  purchases: Purchase[]
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'CANCELLED_BY_STUDENT', label: 'Canc. aluno' },
  { value: 'CANCELLED_BY_PERSONAL', label: 'Canc. personal' },
  { value: 'PENDING', label: 'Pendente' },
]

const METHOD_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartão' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'DEBIT_CARD', label: 'Débito' },
  { value: 'FREE', label: 'Gratuito' },
]

const colStyle = {
  backgroundColor: 'var(--bg-page)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
} as const

function ColInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full px-2 py-1 text-xs font-sans rounded outline-none"
      style={colStyle}
    />
  )
}

function ColSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="mt-1 w-full px-2 py-1 text-xs font-sans rounded outline-none"
      style={colStyle}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

interface Filters {
  student: string
  personal: string
  plan: string
  status: string
  method: string
}

export function DataTable({ purchases, isLoading }: Props) {
  const [f, setF] = useState<Filters>({ student: '', personal: '', plan: '', status: '', method: '' })
  const set = (key: keyof Filters) => (v: string) => setF(prev => ({ ...prev, [key]: v }))

  const filtered = useMemo(() => purchases.filter(p => {
    if (f.student && !(p.studentName ?? '').toLowerCase().includes(f.student.toLowerCase())) return false
    if (f.personal && !(p.personalName ?? '').toLowerCase().includes(f.personal.toLowerCase())) return false
    if (f.plan && !(p.planName ?? '').toLowerCase().includes(f.plan.toLowerCase())) return false
    if (f.status && p.status !== f.status) return false
    if (f.method && p.paymentMethod !== f.method) return false
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
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 130 }}>
                  <span className="text-xs font-sans font-600 uppercase tracking-widest">Aluno</span>
                  <ColInput value={f.student} onChange={set('student')} placeholder="Filtrar..." />
                </th>
                <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 130 }}>
                  <span className="text-xs font-sans font-600 uppercase tracking-widest">Personal</span>
                  <ColInput value={f.personal} onChange={set('personal')} placeholder="Filtrar..." />
                </th>
                <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 120 }}>
                  <span className="text-xs font-sans font-600 uppercase tracking-widest">Plano</span>
                  <ColInput value={f.plan} onChange={set('plan')} placeholder="Filtrar..." />
                </th>
                <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 80 }}>
                  <span className="text-xs font-sans font-600 uppercase tracking-widest">Valor</span>
                  <div className="mt-1 h-[26px]" />
                </th>
                <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 120 }}>
                  <span className="text-xs font-sans font-600 uppercase tracking-widest">Status</span>
                  <ColSelect value={f.status} onChange={set('status')} options={STATUS_OPTIONS} />
                </th>
                <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 110 }}>
                  <span className="text-xs font-sans font-600 uppercase tracking-widest">Método</span>
                  <ColSelect value={f.method} onChange={set('method')} options={METHOD_OPTIONS} />
                </th>
                <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 90 }}>
                  <span className="text-xs font-sans font-600 uppercase tracking-widest">Data</span>
                  <div className="mt-1 h-[26px]" />
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
                  <td className="px-4 py-3.5 text-sm font-sans font-500 max-w-[130px] truncate" style={{ color: 'var(--text-primary)' }} title={p.studentName ?? undefined}>
                    {p.studentName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.personalName ?? undefined}>
                    {p.personalName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-sans max-w-[120px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.planName ?? undefined}>
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
