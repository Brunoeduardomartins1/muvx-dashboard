'use client'

import { useEffect, useState, useMemo } from 'react'
import { X } from 'lucide-react'
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

export function DrillDownModal(props: Props) {
  const { title, subtitle, onClose } = props

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-card overflow-hidden"
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

        {/* Body */}
        <div className="overflow-auto flex-1">
          {props.items.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhum registro encontrado.</p>
            </div>
          ) : props.kind === 'purchases' ? (
            <PurchasesTable items={props.items} />
          ) : (
            <PersonalsTable items={props.items} />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 flex-shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
            {props.items.length} {props.items.length === 1 ? 'registro' : 'registros'}
          </span>
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

interface PurchaseFilters { student: string; personal: string; plan: string; status: string; method: string }

function PurchasesTable({ items }: { items: Purchase[] }) {
  const [f, setF] = useState<PurchaseFilters>({ student: '', personal: '', plan: '', status: '', method: '' })
  const set = (key: keyof PurchaseFilters) => (v: string) => setF(prev => ({ ...prev, [key]: v }))

  const filtered = useMemo(() => items.filter(p => {
    if (f.student && !(p.studentName ?? '').toLowerCase().includes(f.student.toLowerCase())) return false
    if (f.personal && !(p.personalName ?? '').toLowerCase().includes(f.personal.toLowerCase())) return false
    if (f.plan && !(p.planName ?? '').toLowerCase().includes(f.plan.toLowerCase())) return false
    if (f.status && p.status !== f.status) return false
    if (f.method && p.paymentMethod !== f.method) return false
    return true
  }), [items, f])

  return (
    <table className="w-full">
      <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)' }}>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 140 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">Aluno</span>
            <ColInput value={f.student} onChange={set('student')} placeholder="Filtrar..." />
          </th>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 140 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">Personal</span>
            <ColInput value={f.personal} onChange={set('personal')} placeholder="Filtrar..." />
          </th>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 130 }}>
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
        {/* row count */}
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <td colSpan={7} className="px-4 py-1.5 text-xs font-sans" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-page)' }}>
            {filtered.length === items.length ? `${items.length} registros` : `${filtered.length} de ${items.length}`}
          </td>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-10 text-center text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
              Nenhum resultado para os filtros aplicados.
            </td>
          </tr>
        ) : filtered.map(p => (
          <tr
            key={p.id}
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
  )
}

interface PersonalFilters { name: string; email: string }

function PersonalsTable({ items }: { items: PersonalRow[] }) {
  const [f, setF] = useState<PersonalFilters>({ name: '', email: '' })
  const set = (key: keyof PersonalFilters) => (v: string) => setF(prev => ({ ...prev, [key]: v }))

  const filtered = useMemo(() => items.filter(p => {
    if (f.name && !p.personalName.toLowerCase().includes(f.name.toLowerCase())) return false
    if (f.email && !(p.email ?? '').toLowerCase().includes(f.email.toLowerCase())) return false
    return true
  }), [items, f])

  return (
    <table className="w-full">
      <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)' }}>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 40 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">#</span>
            <div className="mt-1 h-[26px]" />
          </th>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 180 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">Personal</span>
            <ColInput value={f.name} onChange={set('name')} placeholder="Filtrar..." />
          </th>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 200 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">E-mail</span>
            <ColInput value={f.email} onChange={set('email')} placeholder="Filtrar..." />
          </th>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 90 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">Produtos</span>
            <div className="mt-1 h-[26px]" />
          </th>
          <th className="px-4 py-2 text-left align-top" style={{ color: 'var(--text-muted)', minWidth: 130 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">Vendas</span>
            <div className="mt-1 h-[26px]" />
          </th>
        </tr>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <td colSpan={5} className="px-4 py-1.5 text-xs font-sans" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-page)' }}>
            {filtered.length === items.length ? `${items.length} registros` : `${filtered.length} de ${items.length}`}
          </td>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-10 text-center text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
              Nenhum resultado para os filtros aplicados.
            </td>
          </tr>
        ) : filtered.map((p, i) => (
          <tr
            key={p.personalId}
            className="transition-colors duration-150"
            style={{ borderBottom: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <td className="px-4 py-3.5 text-sm font-grotesk font-700" style={{ color: 'var(--text-muted)' }}>
              {i + 1}
            </td>
            <td className="px-4 py-3.5 text-sm font-sans font-500 max-w-[180px] truncate" style={{ color: 'var(--text-primary)' }} title={p.personalName}>
              {p.personalName}
            </td>
            <td className="px-4 py-3.5 text-sm font-sans max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.email ?? undefined}>
              {p.email ?? '—'}
            </td>
            <td className="px-4 py-3.5 text-sm font-grotesk font-600" style={{ color: '#08F887' }}>
              {fmtNum(p.productsCount)}
            </td>
            <td className="px-4 py-3.5 text-sm font-grotesk font-600" style={{ color: 'var(--text-primary)' }}>
              {fmtNum(p.salesCount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
