export function fmtBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function fmtPct(value: number, decimals = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

export function fmtNum(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return '—'
  }
}

export function fmtAgo(isoStr: string | null): string {
  if (!isoStr) return 'nunca'
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'agora mesmo'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `há ${diffD}d`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Status de compras → label em PT-BR.
// Status atuais na API (auditado 2026-04-17): ACTIVE, CANCELLED, CANCELLED_BY_STUDENT, INACTIVE, REFUNDED.
// Os demais são legados — mantidos para dados históricos.
export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Expirado',
  CANCELLED: 'Cancelado',
  CANCELLED_BY_STUDENT: 'Canc. Aluno',
  CANCELLED_BY_PERSONAL: 'Canc. Personal',
  REFUNDED: 'Reembolsado',
  // legados
  COMPLETED: 'Concluído',
  APPROVED: 'Aprovado',
  PAYMENT_PENDING: 'Ag. Pagamento',
  PENDING_APPROVAL: 'Ag. Aprovação',
  PENDING: 'Pendente',
  SCHEDULED: 'Agendado',
  REJECTED: 'Rejeitado',
  OVERDUE: 'Vencido',
  EXPIRED: 'Expirado',
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#08F887',
  INACTIVE: '#9CA3AF',
  CANCELLED: '#EF4444',
  CANCELLED_BY_STUDENT: '#EF4444',
  CANCELLED_BY_PERSONAL: '#EF4444',
  REFUNDED: '#F97316',
  // legados
  COMPLETED: '#08F887',
  APPROVED: '#08F887',
  PAYMENT_PENDING: '#F59E0B',
  PENDING_APPROVAL: '#F59E0B',
  PENDING: '#F59E0B',
  SCHEDULED: '#06B6D4',
  REJECTED: '#EF4444',
  EXPIRED: '#9CA3AF',
  OVERDUE: '#F97316',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão',
  DEBIT_CARD: 'Débito',
  FREE: 'Gratuito',
}

// Agrupamento de status para visualização consolidada.
// Regra de negócio (auditada 2026-04-17): status equivalentes viram um único bucket.
//  - Concluídas:  COMPLETED(legado), ACTIVE
//  - Agendadas:   SCHEDULED(legado), PAYMENT_PENDING(legado)
//  - Canceladas:  CANCELLED, CANCELLED_BY_STUDENT, CANCELLED_BY_PERSONAL
//  - Expiradas:   EXPIRED(legado), INACTIVE
//  - Reembolsadas: REFUNDED
export type StatusGroup = 'COMPLETED' | 'SCHEDULED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED' | 'OTHER'

export const STATUS_GROUP_MAP: Record<string, StatusGroup> = {
  ACTIVE: 'COMPLETED',
  COMPLETED: 'COMPLETED',
  SCHEDULED: 'SCHEDULED',
  PAYMENT_PENDING: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
  CANCELLED_BY_STUDENT: 'CANCELLED',
  CANCELLED_BY_PERSONAL: 'CANCELLED',
  INACTIVE: 'EXPIRED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
}

export const STATUS_GROUP_LABELS: Record<StatusGroup, string> = {
  COMPLETED: 'Concluídas',
  SCHEDULED: 'Agendadas',
  CANCELLED: 'Canceladas',
  EXPIRED: 'Expiradas',
  REFUNDED: 'Reembolsadas',
  OTHER: 'Outras',
}

export const STATUS_GROUP_COLORS: Record<StatusGroup, string> = {
  COMPLETED: '#08F887',
  SCHEDULED: '#06B6D4',
  CANCELLED: '#EF4444',
  EXPIRED: '#9CA3AF',
  REFUNDED: '#F97316',
  OTHER: '#6B7280',
}

export function groupStatus(status: string): StatusGroup {
  return STATUS_GROUP_MAP[status] ?? 'OTHER'
}

export function groupPurchaseStatuses(purchasesByStatus: Record<string, number>): Record<StatusGroup, number> {
  const out: Record<StatusGroup, number> = {
    COMPLETED: 0, SCHEDULED: 0, CANCELLED: 0, EXPIRED: 0, REFUNDED: 0, OTHER: 0,
  }
  for (const [status, count] of Object.entries(purchasesByStatus)) {
    out[groupStatus(status)] += count
  }
  return out
}

export function cancellationSource(status: string, reason: string | null): string {
  if (status === 'CANCELLED_BY_STUDENT') return 'Aluno'
  if (status === 'CANCELLED_BY_PERSONAL') return 'Personal'
  if (status === 'EXPIRED' || status === 'INACTIVE') return 'Pagamento não realizado'
  if (status === 'REFUNDED') return 'Reembolso'
  if (status === 'CANCELLED') {
    const r = (reason ?? '').toUpperCase()
    if (r.startsWith('[ADMIN]')) return 'Admin'
    if (r.includes('PAGAR.ME') || r.includes('WEBHOOK')) return 'Pagar.me'
    if (r.includes('PERSONAL') || r.includes('CASCATA')) return 'Personal'
    return 'Sistema'
  }
  return '—'
}

export function cancellationReasonClean(reason: string | null): string {
  if (!reason) return '—'
  return reason
    .replace(/^\[ADMIN\]\s*/, '')
    .replace(/^\[PERSONAL_SCHEDULE_CONFLICT\]\s*/, '')
    .replace(/^\[CASCATA\]\s*/, '')
    .trim() || '—'
}
