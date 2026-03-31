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

// Status de compras → label em PT-BR
export const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluído',
  APPROVED: 'Aprovado',
  ACTIVE: 'Ativo',
  PAYMENT_PENDING: 'Ag. Pagamento',
  PENDING_APPROVAL: 'Ag. Aprovação',
  PENDING: 'Pendente',
  SCHEDULED: 'Agendado',
  CANCELLED: 'Cancelado',
  CANCELLED_BY_STUDENT: 'Canc. Aluno',
  REJECTED: 'Rejeitado',
  OVERDUE: 'Vencido',
  EXPIRED: 'Expirado',
  REFUNDED: 'Reembolsado',
}

export const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#08F887',
  APPROVED: '#08F887',
  ACTIVE: '#08F887',
  PAYMENT_PENDING: '#F59E0B',
  PENDING_APPROVAL: '#F59E0B',
  PENDING: '#F59E0B',
  SCHEDULED: '#06B6D4',
  CANCELLED: '#EF4444',
  CANCELLED_BY_STUDENT: '#EF4444',
  REJECTED: '#EF4444',
  EXPIRED: '#9CA3AF',
  REFUNDED: '#F97316',
  OVERDUE: '#F97316',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão',
  DEBIT_CARD: 'Débito',
  FREE: 'Gratuito',
}
