'use client'

import { useEffect, useState, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import type { Purchase, PersonalRow } from '@/lib/types'
import { fmtBRL, fmtDate, fmtNum, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'

interface PurchasesModal {
  kind: 'purchases'
  title: string
  subtitle?: string
  items: Purchase[]
}

interface PersonalsModal {
  kind: 'personals'
  title: string
  subtitle?: string
  items: PersonalRow[]
}

type Props = (PurchasesModal | PersonalsModal) & { onClose: () => void }

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'CANCELLED_BY_STUDENT', label: 'Canc. pelo aluno' },
  { value: 'CANCELLED_BY_PERSONAL', label: 'Canc. pelo personal' },
  { value: 'PENDING', label: 'Pendente' },
]

const inputStyle = {
  backgroundColor: 'var(--bg-page)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
} as const

export function DrillDownModal(props: Props) {
  const { title, subtitle, onClose } = props
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (props.kind === 'purchases') {
      return props.items.filter((p: Purchase) => {
        if (statusFilter && p.status !== statusFilter) return false
        if (!q) return true
        return (
          (p.studentName ?? '').toLowerCase().includes(q) ||
          (p.personalName ?? '').toLowerCase().includes(q) ||
          (p.planName ?? '').toLowerCase().includes(q) ||
          (p.paymentMethod ?? '').toLowerCase().includes(q)
        )
      })
    } else {
      return props.items.filter((p: PersonalRow) => {
        if (!q) return true
        return (
          p.personalName.toLowerCase().includes(q) ||
          (p.email ?? '').toLowerCase().includes(q)
        )
      })
    }
  }, [props, search, statusFilter])

  const total = props.items.length
  const count = filteredItems.length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-card overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {subtitle && <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#08F887')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-8 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-sans rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
          {props.kind === 'purchases' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-sans rounded-lg outline-none"
              style={inputStyle}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          <span className="text-xs font-sans ml-auto flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {count === total ? `${total} registros` : `${count} de ${total}`}
          </span>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {count === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhum registro encontrado.</p>
            </div>
          ) : props.kind === 'purchases' ? (
            <PurchasesTable items={filteredItems as Purchase[]} />
          ) : (
            <PersonalsTable items={filteredItems as PersonalRow[]} />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 flex-shrink-0 flex items-center justify-end" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-sans font-600 border transition-all duration-150"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function PurchasesTable({ items }: { items: Purchase[] }) {
  return (
    <table className="w-full">
      <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)' }}>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          {['Aluno', 'Personal', 'Plano', 'Valor', 'Status', 'Método', 'Data'].map(col => (
            <th key={col} className="px-6 py-3 text-left text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map(p => (
          <tr
            key={p.id}
            className="transition-colors duration-150"
            style={{ borderBottom: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <td className="px-6 py-3.5 text-sm font-sans font-500 max-w-[130px] truncate" style={{ color: 'var(--text-primary)' }} title={p.studentName ?? undefined}>
              {p.studentName ?? '—'}
            </td>
            <td className="px-6 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.personalName ?? undefined}>
              {p.personalName ?? '—'}
            </td>
            <td className="px-6 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.planName ?? undefined}>
              {p.planName ?? '—'}
            </td>
            <td className="px-6 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
              {fmtBRL(p.amount)}
            </td>
            <td className="px-6 py-3.5">
              <StatusBadge status={p.status} />
            </td>
            <td className="px-6 py-3.5 text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>
              {p.paymentMethod ? (PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod) : '—'}
            </td>
            <td className="px-6 py-3.5 text-sm font-sans whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {fmtDate(p.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PersonalsTable({ items }: { items: PersonalRow[] }) {
  return (
    <table className="w-full">
      <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)' }}>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          {['#', 'Personal', 'E-mail', 'Produtos', 'Vendas (histórico)'].map(col => (
            <th key={col} className="px-6 py-3 text-left text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((p, i) => (
          <tr
            key={p.personalId}
            className="transition-colors duration-150"
            style={{ borderBottom: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <td className="px-6 py-3.5 text-sm font-grotesk font-700" style={{ color: 'var(--text-muted)' }}>
              {i + 1}
            </td>
            <td className="px-6 py-3.5 text-sm font-sans font-500 max-w-[160px] truncate" style={{ color: 'var(--text-primary)' }} title={p.personalName}>
              {p.personalName}
            </td>
            <td className="px-6 py-3.5 text-sm font-sans max-w-[180px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.email ?? undefined}>
              {p.email ?? '—'}
            </td>
            <td className="px-6 py-3.5 text-sm font-grotesk font-600" style={{ color: '#08F887' }}>
              {fmtNum(p.productsCount)}
            </td>
            <td className="px-6 py-3.5 text-sm font-grotesk font-600" style={{ color: 'var(--text-primary)' }}>
              {fmtNum(p.salesCount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
