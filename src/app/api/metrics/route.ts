import { NextRequest, NextResponse } from 'next/server'
import { getMuvxToken, muvxGet, getPagarmeTransfersSplit, getMuvxPayables, getMuvxBalance } from '@/lib/api'
import type { MetricsResponse, Purchase, TopPersonal, TopStudent, PersonalRow, WeekdaySales, TopPlan, DailyHeatmapPoint, CheckinsData, FunnelStage } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface AdminDashboard {
  totals?: { users?: number; students?: number; personals?: number; activeUsers?: number }
}
interface AdminStats {
  growth?: { usersLastMonth?: number; studentsLastMonth?: number; personalsLastMonth?: number }
  cref?: { verified?: number; pending?: number }
}
interface AdminOverview {
  users?: { total?: number; active?: number; inactive?: number }
}
interface RawAdminUser {
  id?: string
  username?: string
}
interface AdminUsersResponse {
  data?: RawAdminUser[]
  total?: number
}
interface RawPurchase {
  id?: string
  status?: string
  totalAmount?: number | string
  createdAt?: string
  paymentMethod?: string
  billingType?: string
  recurrenceInterval?: string
  originalProduct?: { name?: string; deliveryMode?: string }
  student?: { id?: string; userId?: string; name?: string; email?: string }
  personal?: { id?: string; name?: string; email?: string }
  cancellationReason?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  nextBillingDate?: string | null
  completedAt?: string | null
  paymentTransaction?: { status?: string } | null
}
interface AdminPurchasesResponse {
  data?: RawPurchase[]
  total?: number
  totalPages?: number
}
interface RawPersonal {
  id?: string
  createdAt?: string
  user?: { fullName?: string; name?: string; email?: string }
  averageRating?: number | null
  totalRatings?: number
  _count?: { products?: number; salesReceived?: number }
}
interface AdminPersonalsResponse {
  data?: RawPersonal[]
  meta?: { total?: number; totalPages?: number }
}
interface ActivationStepDist {
  step?: string
  count?: number
  percentage?: number
  label?: string
}
interface ActivationIndicatorsResponse {
  percentageIndicators?: { totalPersonals?: number }
  stepDistribution?: { data?: ActivationStepDist[]; total?: number }
}
interface RawCheckinsResponse {
  checkinSummary?: { today?: number; last7Days?: number; last30Days?: number; period?: number }
  studentEngagement?: { totalStudents?: number; activeStudents?: number; inactiveStudents?: number; newStudents?: number; averageCheckinsPerStudent?: number; activePercentage?: number }
  weeklyGoalAchievement?: { studentsWhoMetGoal?: number; totalStudentsWithGoal?: number; achievementRate?: number }
  topActivities?: { activity?: string; count?: number; percentage?: number }[]
  dayOfWeekDistribution?: { dayOfWeek?: number; dayName?: string; count?: number; percentage?: number }[]
  dailyHistory?: { date?: string; count?: number }[]
}

// Status reais da API MUVX (auditado em 2026-04-17):
//  - ACTIVE                 → assinatura paga, com nextBillingDate futuro
//  - CANCELLED              → cancelada pelo personal/admin/sistema
//  - CANCELLED_BY_STUDENT   → cancelada pelo aluno
//  - CANCELLED_BY_PERSONAL  → (raro/extinto) cancelada pelo personal
//  - INACTIVE               → expirada (paymentTransaction.status = EXPIRED)
//  - REFUNDED               → reembolsada
// Status antigos (COMPLETED, SCHEDULED, PAYMENT_PENDING, EXPIRED) foram descontinuados
// mas mantemos em mapas de compatibilidade para dados históricos.
const CANCELLED_STATUSES = ['CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_PERSONAL']
const COMPLETED_STATUSES = ['COMPLETED', 'ACTIVE']
const SCHEDULED_STATUSES = ['SCHEDULED', 'PAYMENT_PENDING']
const EXPIRED_STATUSES   = ['EXPIRED', 'INACTIVE']
const SCHEDULED_STATUS = 'SCHEDULED'
const MUVX_FEE_FIXED = 3.99
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function toISO(d: string, end = false) {
  return end ? `${d}T23:59:59.999Z` : `${d}T00:00:00.000Z`
}

function dateDiffDays(from: string, to: string): number {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(diff / 86_400_000) + 1)
}

export async function GET(req: NextRequest) {
  const errors: string[] = []

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const defaultFrom = '2025-01-01'
  const defaultTo = now.toISOString().split('T')[0]
  const fromDate = searchParams.get('from') ?? defaultFrom
  const toDate   = searchParams.get('to')   ?? defaultTo
  const createdFrom = toISO(fromDate)
  const createdTo   = toISO(toDate, true)

  // days in period & days in current month (for projection)
  const daysInPeriod = dateDiffDays(fromDate, toDate)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()

  let token: string
  try { token = await getMuvxToken() } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const purchasesPath      = `/admin/purchases?limit=100&page=1&createdFrom=${encodeURIComponent(createdFrom)}&createdTo=${encodeURIComponent(createdTo)}`
  const periodPersonalsPath = `/admin/personals?limit=1&page=1&createdFrom=${encodeURIComponent(createdFrom)}&createdTo=${encodeURIComponent(createdTo)}`
  const checkinsPath        = `/admin/student-usage-indicators?startDate=${fromDate}&endDate=${toDate}`

  const [dashRes, statsRes, overviewRes, purchasesRes, personalsP1Res, periodPersonalsRes, pagarmeSplitRes, checkinsRes, activePersonalsRes, activeStudentsRes, scheduledP1Res, checkoutUsersRes, payablesRes, balanceRes, activationRes] =
    await Promise.allSettled([
      muvxGet<AdminDashboard>('/admin/dashboard', token),
      muvxGet<AdminStats>('/admin/dashboard/stats', token),
      muvxGet<AdminOverview>('/admin/stats/overview', token),
      muvxGet<AdminPurchasesResponse>(purchasesPath, token),
      muvxGet<AdminPersonalsResponse>('/admin/personals?limit=100&page=1', token),
      muvxGet<AdminPersonalsResponse>(periodPersonalsPath, token),
      getPagarmeTransfersSplit(fromDate, toDate),
      muvxGet<RawCheckinsResponse>(checkinsPath, token),
      muvxGet<{ total?: number }>('/admin/users?profileType=personal&isActive=true&limit=1&page=1', token),
      muvxGet<{ total?: number }>('/admin/users?profileType=student&isActive=true&limit=1&page=1', token),
      muvxGet<AdminPurchasesResponse>('/admin/purchases?limit=100&page=1&status=ACTIVE', token),
      muvxGet<AdminUsersResponse>('/admin/users?search=checkout_&limit=100&page=1', token),
      getMuvxPayables(fromDate, toDate),
      getMuvxBalance(),
      muvxGet<ActivationIndicatorsResponse>(`/admin/activation-indicators?startDate=${encodeURIComponent(createdFrom)}&endDate=${encodeURIComponent(createdTo)}`, token),
    ])

  const dashboard     = dashRes.status      === 'fulfilled' ? dashRes.value      : null
  const stats         = statsRes.status     === 'fulfilled' ? statsRes.value     : null
  const overview      = overviewRes.status  === 'fulfilled' ? overviewRes.value  : null
  const purchasesP1   = purchasesRes.status === 'fulfilled' ? purchasesRes.value : null
  const personalsP1   = personalsP1Res.status === 'fulfilled' ? personalsP1Res.value : null
  const periodPersonals = (periodPersonalsRes.status === 'fulfilled' ? periodPersonalsRes.value?.meta?.total : null) ?? 0
  const pagarmeSplit = pagarmeSplitRes.status === 'fulfilled'
    ? (pagarmeSplitRes.value ?? { personalTransfers: [], muvxTransfers: [] })
    : { personalTransfers: [], muvxTransfers: [] }
  const pagarmeTransfers = pagarmeSplit.personalTransfers
  const pagarmeMuvxTransfers = pagarmeSplit.muvxTransfers
  const payables = payablesRes.status === 'fulfilled' ? (payablesRes.value ?? []) : []
  const balance  = balanceRes.status === 'fulfilled' ? balanceRes.value : null
  const rawCheckins   = checkinsRes.status  === 'fulfilled' ? checkinsRes.value  : null
  const activePersonals = (activePersonalsRes.status === 'fulfilled' ? activePersonalsRes.value?.total : null) ?? 0
  const activeStudents  = (activeStudentsRes.status  === 'fulfilled' ? activeStudentsRes.value?.total  : null) ?? 0
  const activeUsersWithProfile = activePersonals + activeStudents
  const scheduledP1     = scheduledP1Res.status === 'fulfilled' ? scheduledP1Res.value : null
  const activation      = activationRes.status === 'fulfilled' ? activationRes.value : null
  const checkoutUsers   = checkoutUsersRes.status === 'fulfilled' ? (checkoutUsersRes.value?.data ?? []) : []
  const checkoutUserIds = new Set(checkoutUsers.map(u => u.id).filter(Boolean) as string[])

  if (!dashboard)   errors.push('admin/dashboard indisponível')
  if (!stats)       errors.push('admin/dashboard/stats indisponível')
  if (!overview)    errors.push('admin/stats/overview indisponível')
  if (!purchasesP1)   errors.push('admin/purchases indisponível')
  if (!personalsP1) errors.push('admin/personals indisponível')

  // Paginar todas as compras
  const totalPurchasesPages = purchasesP1?.totalPages ?? 1
  let allRawPurchases: RawPurchase[] = purchasesP1?.data ?? []
  if (totalPurchasesPages > 1) {
    const extraPages = Array.from({ length: totalPurchasesPages - 1 }, (_, i) => i + 2)
    const extraRes = await Promise.allSettled(
      extraPages.map(p => muvxGet<AdminPurchasesResponse>(
        `/admin/purchases?limit=100&page=${p}&createdFrom=${encodeURIComponent(createdFrom)}&createdTo=${encodeURIComponent(createdTo)}`, token
      ))
    )
    for (const r of extraRes) {
      if (r.status === 'fulfilled' && r.value?.data) allRawPurchases = allRawPurchases.concat(r.value.data)
    }
  }

  // ── GMV pago/expirado/cancelado ──
  // Não precisamos mais buscar transactions individuais (custo alto, rate limit).
  // Derivamos direto do status das purchases do período + valor contratado.
  type RealRevenue = { gmv: number; muvx: number; personal: number; trxs: number }
  const realByStatus = {
    paid:      { gmv: 0, muvx: 0, personal: 0, trxs: 0 } as RealRevenue,
    expired:   { gmv: 0, muvx: 0, personal: 0, trxs: 0 } as RealRevenue,
    cancelled: { gmv: 0, muvx: 0, personal: 0, trxs: 0 } as RealRevenue,
    other:     { gmv: 0, muvx: 0, personal: 0, trxs: 0 } as RealRevenue,
  }
  const transactionsMissingSplit = 0
  const transactionsWithoutRecord = 0

  for (const p of allRawPurchases) {
    const amt = Number(p.totalAmount ?? 0)
    const st  = p.status ?? ''
    let bucket: RealRevenue
    if (st === 'ACTIVE' || st === 'COMPLETED') bucket = realByStatus.paid
    else if (st === 'INACTIVE' || st === 'EXPIRED') bucket = realByStatus.expired
    else if (st === 'CANCELLED' || st === 'CANCELLED_BY_STUDENT' || st === 'CANCELLED_BY_PERSONAL' || st === 'REFUNDED') bucket = realByStatus.cancelled
    else bucket = realByStatus.other
    bucket.gmv += amt
    bucket.trxs += 1
  }

  // Paginar todas as ACTIVE (assinaturas em andamento — são a fonte de próximas cobranças)
  let allActive: RawPurchase[] = scheduledP1?.data ?? []
  const totalActivePages = scheduledP1?.totalPages ?? 1
  if (totalActivePages > 1) {
    const extraPages = Array.from({ length: totalActivePages - 1 }, (_, i) => i + 2)
    const extraRes = await Promise.allSettled(
      extraPages.map(p => muvxGet<AdminPurchasesResponse>(`/admin/purchases?limit=100&page=${p}&status=ACTIVE`, token))
    )
    for (const r of extraRes) {
      if (r.status === 'fulfilled' && r.value?.data) allActive = allActive.concat(r.value.data)
    }
  }

  // Paginar todos os personais
  const totalPersonalsPages = personalsP1?.meta?.totalPages ?? 1
  let allPersonals: RawPersonal[] = personalsP1?.data ?? []
  if (totalPersonalsPages > 1) {
    const extraPages = Array.from({ length: totalPersonalsPages - 1 }, (_, i) => i + 2)
    const extraRes = await Promise.allSettled(
      extraPages.map(p => muvxGet<AdminPersonalsResponse>(`/admin/personals?limit=100&page=${p}`, token))
    )
    for (const r of extraRes) {
      if (r.status === 'fulfilled' && r.value?.data) allPersonals = allPersonals.concat(r.value.data)
    }
  }

  // ── Totais globais ──────────────────────────────────────────────────────────
  const totalUsers     = dashboard?.totals?.users     ?? 0
  const totalStudents  = dashboard?.totals?.students  ?? 0
  const totalPersonals = dashboard?.totals?.personals ?? 0
  const inactiveUsers  = overview?.users?.inactive ?? 0
  const usersGrowthLastMonth     = stats?.growth?.usersLastMonth    ?? 0
  const studentsGrowthLastMonth  = stats?.growth?.studentsLastMonth ?? 0
  const personalsGrowthLastMonth = stats?.growth?.personalsLastMonth ?? 0
  const crefVerified = stats?.cref?.verified ?? 0
  const crefPending  = stats?.cref?.pending  ?? 0
  const crefApprovalRate = (crefVerified + crefPending) > 0
    ? (crefVerified / (crefVerified + crefPending)) * 100 : 0

  // ── Purchases no período ────────────────────────────────────────────────────
  const rawPurchases: RawPurchase[] = allRawPurchases
  const purchasesTotal = purchasesP1?.total ?? rawPurchases.length

  const purchasesByStatus: Record<string, number> = {}
  const purchasesByStatusDetail: Record<string, Purchase[]> = {}
  const personalSalesMap: Record<string, { name: string; completed: number; scheduled: number; cancelled: number; revenue: number }> = {}
  const studentSpendMap:  Record<string, { name: string; spent: number; count: number }> = {}
  const paymentMethodBreakdown: Record<string, number> = {}
  const recurrenceBreakdown: Record<string, number> = {}
  const planMap: Record<string, { count: number; revenue: number }> = {}
  const dailyMap: Record<string, { count: number; revenue: number }> = {}
  const weekdayMap: Record<number, { count: number; revenue: number }> = {}
  let recurringCount = 0; let oneTimeCount = 0
  let recurringRevenue = 0; let oneTimeRevenue = 0

  for (const p of rawPurchases) {
    const status = p.status ?? 'UNKNOWN'
    const amount = Number(p.totalAmount ?? 0)

    // Status aggregation
    purchasesByStatus[status] = (purchasesByStatus[status] ?? 0) + 1
    const detail: Purchase = {
      id: p.id ?? '',
      studentName: p.student?.name ?? null,
      personalName: p.personal?.name ?? null,
      amount,
      status,
      createdAt: p.createdAt ?? null,
      paymentMethod: p.paymentMethod ?? null,
      planName: p.originalProduct?.name ?? null,
      billingType: p.billingType ?? null,
      recurrenceInterval: p.recurrenceInterval ?? null,
      cancellationReason: p.cancellationReason ?? null,
      cancelledBy: p.cancelledBy ?? null,
      cancelledAt: p.cancelledAt ?? null,
    }
    if (!purchasesByStatusDetail[status]) purchasesByStatusDetail[status] = []
    purchasesByStatusDetail[status].push(detail)

    // Personal sales map
    const pid = p.personal?.id
    if (pid) {
      if (!personalSalesMap[pid]) personalSalesMap[pid] = { name: p.personal?.name ?? '—', completed: 0, scheduled: 0, cancelled: 0, revenue: 0 }
      const pe = personalSalesMap[pid]
      if (COMPLETED_STATUSES.includes(status))      { pe.completed++; pe.revenue += amount }
      else if (SCHEDULED_STATUSES.includes(status)) { pe.scheduled++ }
      else if (CANCELLED_STATUSES.includes(status)) { pe.cancelled++ }
    }

    // Top students (by spend on COMPLETED)
    const sid = p.student?.id
    if (sid && COMPLETED_STATUSES.includes(status)) {
      if (!studentSpendMap[sid]) studentSpendMap[sid] = { name: p.student?.name ?? '—', spent: 0, count: 0 }
      studentSpendMap[sid].spent += amount
      studentSpendMap[sid].count++
    }

    // Top plans (COMPLETED only)
    if (COMPLETED_STATUSES.includes(status) && p.originalProduct?.name) {
      const pname = p.originalProduct.name
      if (!planMap[pname]) planMap[pname] = { count: 0, revenue: 0 }
      planMap[pname].count++
      planMap[pname].revenue += amount
    }

    // Payment method — só completed/scheduled
    const isActive = COMPLETED_STATUSES.includes(status) || SCHEDULED_STATUSES.includes(status)
    if (isActive && p.paymentMethod) {
      paymentMethodBreakdown[p.paymentMethod] = (paymentMethodBreakdown[p.paymentMethod] ?? 0) + 1
    }

    // Billing type
    if (p.billingType === 'RECURRING') { recurringCount++; recurringRevenue += amount }
    else if (p.billingType === 'ONE_TIME') { oneTimeCount++; oneTimeRevenue += amount }

    // Recurrence interval — só ativas
    if (isActive && p.recurrenceInterval) {
      recurrenceBreakdown[p.recurrenceInterval] = (recurrenceBreakdown[p.recurrenceInterval] ?? 0) + 1
    }

    // Weekday
    if (p.createdAt) {
      const wd = new Date(p.createdAt).getDay()
      if (!weekdayMap[wd]) weekdayMap[wd] = { count: 0, revenue: 0 }
      weekdayMap[wd].count++
      if (COMPLETED_STATUSES.includes(status)) weekdayMap[wd].revenue += amount
    }

    // Daily heatmap
    if (p.createdAt) {
      const day = p.createdAt.split('T')[0]
      if (!dailyMap[day]) dailyMap[day] = { count: 0, revenue: 0 }
      dailyMap[day].count++
      if (COMPLETED_STATUSES.includes(status)) dailyMap[day].revenue += amount
    }
  }

  // Alunos únicos no período
  const uniqueStudentIds = new Set(rawPurchases.map(p => p.student?.id).filter(Boolean))
  const periodStudents = uniqueStudentIds.size

  // Financeiro
  const completedSales    = COMPLETED_STATUSES.reduce((sum, s) => sum + (purchasesByStatus[s] ?? 0), 0)
  const cancelledSales    = [...CANCELLED_STATUSES, ...EXPIRED_STATUSES, 'REFUNDED']
    .reduce((sum, s) => sum + (purchasesByStatus[s] ?? 0), 0)
  const revenueInPeriod   = rawPurchases.filter(p => COMPLETED_STATUSES.includes(String(p.status ?? ''))).reduce((s, p) => s + Number(p.totalAmount ?? 0), 0)

  // Aguardando pagamento = assinaturas ativas cujo nextBillingDate cai dentro do período
  const fromMs = new Date(createdFrom).getTime()
  const toMs   = new Date(createdTo).getTime()
  const scheduledInPeriod = allActive.filter(p => {
    if (!p.nextBillingDate) return false
    const t = new Date(p.nextBillingDate).getTime()
    return t >= fromMs && t <= toMs
  })
  const scheduledSales   = scheduledInPeriod.length
  const scheduledRevenue = scheduledInPeriod.reduce((s, p) => s + Number(p.totalAmount ?? 0), 0)
  const realizedSales    = completedSales + scheduledSales

  // Sobrescrever detail[SCHEDULED] para refletir agendados com cobrança no período, não criados no período
  purchasesByStatusDetail[SCHEDULED_STATUS] = scheduledInPeriod.map(p => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'SCHEDULED',
    createdAt: p.nextBillingDate ?? p.createdAt ?? null,
    paymentMethod: p.paymentMethod ?? null,
    planName: p.originalProduct?.name ?? null,
    billingType: p.billingType ?? null,
    recurrenceInterval: p.recurrenceInterval ?? null,
    cancellationReason: p.cancellationReason ?? null,
    cancelledBy: p.cancelledBy ?? null,
    cancelledAt: p.cancelledAt ?? null,
  }))
  purchasesByStatus[SCHEDULED_STATUS] = scheduledSales

  // ── Receita MUVX REAL via payables do Pagar.me ──
  // Payables = recebíveis LÍQUIDOS (após todas as taxas: processamento, antecipação, MDR).
  // São os valores que efetivamente caem na conta MUVX.
  // - status 'paid': já disponível/transferido
  // - status 'waiting_funds': aguardando liberação no ciclo (D+14 com antecipação ativa)
  const pagarmeRepasse   = pagarmeTransfers.reduce((s, t) => s + t.amount / 100, 0)
  const pagarmeAvailable = payables.length > 0 || pagarmeTransfers.length > 0 || pagarmeMuvxTransfers.length > 0

  // Dados de transactions (splits contratuais) para fallback e referência
  const gmvPaid              = realByStatus.paid.gmv
  const gmvExpired           = realByStatus.expired.gmv
  const gmvCancelled         = realByStatus.cancelled.gmv

  // RECEITA LÍQUIDA: soma dos payables do período, líquidos de taxas
  const muvxRevenuePaid      = payables
    .filter(p => p.status === 'paid' || p.status === 'prepaid')
    .reduce((sum, p) => sum + p.amount / 100, 0)
  const muvxRevenueWaiting   = payables
    .filter(p => p.status === 'waiting_funds')
    .reduce((sum, p) => sum + p.amount / 100, 0)
  const muvxRevenueNet       = muvxRevenuePaid + muvxRevenueWaiting

  // Para retrocompatibilidade com os campos antigos da API
  const muvxRevenueExpired   = 0  // payables cancelados/estornados não são listados como receita
  const muvxRevenueCancelled = 0

  // Share efetivo observado: receita líquida / volume transacionado no período (pago + agendado)
  const totalVolumePeriod    = revenueInPeriod + scheduledRevenue
  const muvxShareObserved    = totalVolumePeriod > 0 ? muvxRevenueNet / totalVolumePeriod : 0

  // Projeção de receita líquida sobre cobranças agendadas no período (que ainda não liquidaram)
  const muvxRevenueScheduled = scheduledRevenue * muvxShareObserved

  // Receita total reconhecida (líquida) no período — inclui a projeção de agendados
  const muvxRevenue          = muvxRevenueNet

  // Saques efetivados para conta MUVX (histórico de transferências via transfers)
  const muvxRevenueWithdrawn = pagarmeMuvxTransfers.reduce((s, t) => s + t.amount / 100, 0)
  const muvxWithdrawalsCount = pagarmeMuvxTransfers.length
  const muvxRevenuePending   = muvxRevenueWaiting

  // ── Projeção 12 meses ──
  // Dois conceitos distintos:
  //
  // 1) PROJEÇÃO DAS VENDAS DO PERÍODO (mais relevante para apresentação):
  //    Quantas cobranças cada assinatura firmada NO PERÍODO vai gerar em 12 meses,
  //    respeitando o intervalo de recorrência.
  //    Cada mensal gera 12, trimestral 4, semestral 2, anual 1.
  //
  // 2) PROJEÇÃO DA BASE ATIVA TOTAL:
  //    Mesmo cálculo mas sobre todas as assinaturas ACTIVE hoje (inclui meses anteriores).
  const cobrancasPorAno: Record<string, number> = { MONTHLY: 12, QUARTERLY: 4, SEMIANNUAL: 2, ANNUAL: 1 }

  // 1) Vendas do período (ACTIVE criadas no período analisado)
  const vendasDoPeriodoValidas = rawPurchases.filter(p =>
    COMPLETED_STATUSES.includes(String(p.status ?? '')) ||
    SCHEDULED_STATUSES.includes(String(p.status ?? ''))
  )
  let volumeAnualPeriodo = 0
  let cobrancasAnualPeriodo = 0
  for (const p of vendasDoPeriodoValidas) {
    const intv = p.recurrenceInterval ?? 'MONTHLY'
    const amt  = Number(p.totalAmount ?? 0)
    const cobs = cobrancasPorAno[intv] ?? 12
    volumeAnualPeriodo    += amt * cobs
    cobrancasAnualPeriodo += cobs
  }
  const muvxRevenuePeriodAnnualProjected = volumeAnualPeriodo * muvxShareObserved

  // 2) Base ACTIVE total (todas as assinaturas vivas hoje)
  let volumeAnualProjetado = 0
  for (const p of allActive) {
    const intv = p.recurrenceInterval ?? 'MONTHLY'
    const amt  = Number(p.totalAmount ?? 0)
    const cobs = cobrancasPorAno[intv] ?? 12
    volumeAnualProjetado += amt * cobs
  }
  const muvxRevenueAnnualProjected  = volumeAnualProjetado * muvxShareObserved
  const muvxRevenueMonthlyProjected = muvxRevenueAnnualProjected / 12

  // Saldo atual na conta Pagar.me (independe do período)
  const muvxBalanceAvailable     = balance ? balance.available_amount / 100 : 0
  const muvxBalanceWaitingFunds  = balance ? balance.waiting_funds_amount / 100 : 0
  const muvxBalanceTransferred   = balance ? balance.transferred_amount / 100 : 0

  // Aliases legados
  const muvxRevenueReal      = muvxRevenueNet
  const muvxRevenueEstimated = muvxRevenueNet
  void gmvPaid; void gmvExpired; void gmvCancelled  // reservados para referência

  const avgTicket         = realizedSales > 0 ? (revenueInPeriod + scheduledRevenue) / realizedSales : 0

  // Ticket médio por modalidade (produto digital vs presencial) — considera realizadas = COMPLETED no período + SCHEDULED com cobrança no período
  const realizedForTicket: RawPurchase[] = [
    ...rawPurchases.filter(p => COMPLETED_STATUSES.includes(String(p.status ?? ''))),
    ...scheduledInPeriod,
  ]

  // Vendas via checkout/renovação (aluno com username "checkout_*")
  const checkoutRealized = realizedForTicket.filter(p => {
    const uid = p.student?.userId
    return !!uid && checkoutUserIds.has(uid)
  })
  const checkoutSales   = checkoutRealized.length
  const checkoutRevenue = checkoutRealized.reduce((s, p) => s + Number(p.totalAmount ?? 0), 0)
  const checkoutPurchases: Purchase[] = checkoutRealized.map(p => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'UNKNOWN',
    createdAt: p.status === SCHEDULED_STATUS ? (p.nextBillingDate ?? p.createdAt ?? null) : (p.createdAt ?? null),
    paymentMethod: p.paymentMethod ?? null,
    planName: p.originalProduct?.name ?? null,
    billingType: p.billingType ?? null,
    recurrenceInterval: p.recurrenceInterval ?? null,
    cancellationReason: p.cancellationReason ?? null,
    cancelledBy: p.cancelledBy ?? null,
    cancelledAt: p.cancelledAt ?? null,
  }))
  let digitalSum = 0, digitalCount = 0, presentialSum = 0, presentialCount = 0
  for (const p of realizedForTicket) {
    const mode = p.originalProduct?.deliveryMode
    const amt = Number(p.totalAmount ?? 0)
    if (mode === 'ONLINE_DIGITAL') { digitalSum += amt; digitalCount++ }
    else if (mode === 'PRESENCIAL') { presentialSum += amt; presentialCount++ }
  }
  const avgTicketDigital    = digitalCount    > 0 ? digitalSum    / digitalCount    : 0
  const avgTicketPresential = presentialCount > 0 ? presentialSum / presentialCount : 0
  const churnRate         = (completedSales + cancelledSales) > 0 ? (cancelledSales / (completedSales + cancelledSales)) * 100 : 0

  // LTV: receita / alunos únicos no período
  const ltv = periodStudents > 0 ? revenueInPeriod / periodStudents : 0

  // Velocidade de vendas: vendas concluídas por dia no período
  const salesVelocity = completedSales / daysInPeriod

  // Projeção = receita já realizada (completed) + agendada (scheduled) no período
  void daysInMonth; void dayOfMonth
  const projectedMonthRevenue = revenueInPeriod + scheduledRevenue

  // Top planos
  const topPlans: TopPlan[] = Object.entries(planMap)
    .map(([planName, v]) => ({ planName, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue || b.count - a.count)
    .slice(0, 10)

  // Daily heatmap
  const dailyHeatmap: DailyHeatmapPoint[] = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, count: v.count, revenue: v.revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Vendas por dia da semana
  const salesByWeekday: WeekdaySales[] = WEEKDAYS.map((day, i) => ({
    day,
    count: weekdayMap[i]?.count ?? 0,
    revenue: weekdayMap[i]?.revenue ?? 0,
  }))

  // Top students
  const topStudents: TopStudent[] = Object.entries(studentSpendMap)
    .map(([studentId, s]) => ({ studentId, studentName: s.name, totalSpent: s.spent, purchasesCount: s.count }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)

  // ── Engajamento de personais ────────────────────────────────────────────────
  const toPersonalRow = (p: RawPersonal): PersonalRow => ({
    personalId: p.id ?? '',
    personalName: p.user?.fullName ?? p.user?.name ?? 'Desconhecido',
    email: p.user?.email ?? null,
    productsCount: p._count?.products ?? 0,
    salesCount: p._count?.salesReceived ?? 0,
  })

  const personalsWithProductList = allPersonals.filter(p => (p._count?.products ?? 0) > 0).map(toPersonalRow)
  const personalsWithProduct     = personalsWithProductList.length
  const personalsWithSaleTotal   = allPersonals.filter(p => (p._count?.salesReceived ?? 0) > 0).length
  const personalsWithSale        = Object.keys(personalSalesMap).length
  const personalsWithSaleInPeriod = Object.values(personalSalesMap).filter(s => s.completed > 0).length

  const personalsWithSaleList: PersonalRow[] = Object.entries(personalSalesMap).map(([pid, s]) => {
    const found = allPersonals.find(p => p.id === pid)
    return { personalId: pid, personalName: s.name, email: found?.user?.email ?? null, productsCount: found?._count?.products ?? 0, salesCount: s.completed + s.scheduled + s.cancelled }
  })

  const allPurchasesInPeriod: Purchase[] = rawPurchases.map(p => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'UNKNOWN',
    createdAt: p.createdAt ?? null,
    paymentMethod: p.paymentMethod ?? null,
    planName: p.originalProduct?.name ?? null,
    billingType: p.billingType ?? null,
    recurrenceInterval: p.recurrenceInterval ?? null,
    cancellationReason: p.cancellationReason ?? null,
    cancelledBy: p.cancelledBy ?? null,
    cancelledAt: p.cancelledAt ?? null,
  }))

  // Personais inativos
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const inactivePersonals = allPersonals.filter(p => {
    if (!p.createdAt) return false
    const registered = new Date(p.createdAt) < thirtyDaysAgo
    const hasSaleInPeriod = p.id ? !!personalSalesMap[p.id] : false
    return registered && !hasSaleInPeriod
  }).length

  const activationRate  = totalPersonals > 0 ? (personalsWithProduct / totalPersonals) * 100 : 0
  const conversionRate          = personalsWithProduct > 0 ? (personalsWithSaleInPeriod / personalsWithProduct) * 100 : 0
  const conversionRateHistorical = totalPersonals > 0 ? (personalsWithSaleTotal / totalPersonals) * 100 : 0

  // ── Funil de ativação exclusivo (top-down) ─────────────────────────────────
  // COORTE: personais cadastrados no período filtrado (não a base toda).
  // Cada personal cai em UMA única etapa — a mais avançada que atingiu.
  //
  // Etapas (do mais avançado pro menos):
  //   6. Aluno recorrente   — tem ≥1 ACTIVE com billingType=RECURRING
  //   5. Vendeu mais de 1   — _count.salesReceived > 1
  //   4. Vendeu 1 vez       — _count.salesReceived = 1
  //   3. Convidou aluno     — firstStudentInvited (sem venda)
  //   2. Criou produto      — firstProductCreated (sem convite)
  //   1. Só cadastrou       — resto
  //
  // Fontes:
  // - "Criou produto" e "Convidou aluno" vêm de /admin/activation-indicators
  //   filtrado pelo mesmo período (cohort) — totalPersonals e contagens já
  //   limitam aos personais com createdAt no range. Flags são independentes,
  //   mas assumimos monotonicidade do funil natural: vendedor ⊆ convidador ⊆
  //   criou produto (validado em amostra).
  // - "Vendeu" / "vendeu mais de 1" / "recorrente" são derivados de
  //   _count.salesReceived (lifetime) e da lista ACTIVE recurring,
  //   FILTRANDO allPersonals por createdAt no período (mesma cohort).
  const stepDist = activation?.stepDistribution?.data ?? []
  const stepCount = (key: string) => stepDist.find(s => s.step === key)?.count ?? 0
  const productHistorical = stepCount('FIRST_PRODUCT_CREATED')
  const invitedHistorical = stepCount('FIRST_STUDENT_INVITED')
  // Total de personais da coorte do período (vem do agregado, mais preciso
  // que filtrar allPersonals por createdAt — cobre paginação completa)
  const cohortTotal = activation?.percentageIndicators?.totalPersonals ?? periodPersonals

  // Coorte: personais com createdAt dentro do período
  const cohortPersonals = allPersonals.filter(p => {
    if (!p.createdAt) return false
    const t = new Date(p.createdAt).getTime()
    return t >= fromMs && t <= toMs
  })
  const cohortPersonalIds = new Set(cohortPersonals.map(p => p.id).filter(Boolean) as string[])

  // Particionamento exclusivo por personal (etapas finais, lifetime do indivíduo)
  const recurringPersonalIds = new Set<string>(
    allActive
      .filter(p => p.billingType === 'RECURRING' && p.personal?.id && cohortPersonalIds.has(p.personal.id))
      .map(p => p.personal!.id!)
  )

  let personalsRecurring = 0
  let personalsMultiSaleEx = 0
  let personalsSoldOnceEx = 0
  for (const p of cohortPersonals) {
    const sales = p._count?.salesReceived ?? 0
    if (sales <= 0) continue
    if (p.id && recurringPersonalIds.has(p.id)) personalsRecurring++
    else if (sales > 1) personalsMultiSaleEx++
    else personalsSoldOnceEx++
  }
  const cohortSoldTotal = personalsRecurring + personalsMultiSaleEx + personalsSoldOnceEx

  // Etapas anteriores: contagens do agregado já são da coorte do período
  const personalsInvitedNotSold = Math.max(0, invitedHistorical - cohortSoldTotal)
  const personalsProductNotInvited = Math.max(0, productHistorical - invitedHistorical)
  // Só cadastraram = total da coorte − todos os outros
  const personalsOnlyRegistered = Math.max(
    0,
    cohortTotal
      - personalsProductNotInvited
      - personalsInvitedNotSold
      - personalsSoldOnceEx
      - personalsMultiSaleEx
      - personalsRecurring
  )

  const funnelStages: FunnelStage[] = [
    { key: 'registered', label: 'Só cadastraram',       count: personalsOnlyRegistered },
    { key: 'product',    label: 'Criaram produto',      count: personalsProductNotInvited },
    { key: 'invited',    label: 'Convidaram aluno',     count: personalsInvitedNotSold },
    { key: 'sold_once',  label: 'Venderam 1 vez',       count: personalsSoldOnceEx },
    { key: 'sold_multi', label: 'Venderam mais de 1',   count: personalsMultiSaleEx },
    { key: 'recurring',  label: 'Têm aluno recorrente', count: personalsRecurring },
  ]

  // Ratings
  const ratedPersonals      = allPersonals.filter(p => p.totalRatings && p.totalRatings > 0 && p.averageRating)
  const avgRating           = ratedPersonals.length > 0 ? ratedPersonals.reduce((sum, p) => sum + (p.averageRating ?? 0), 0) / ratedPersonals.length : 0
  const totalRatedPersonals = ratedPersonals.length

  // Top personais
  const topPersonals: TopPersonal[] = Object.entries(personalSalesMap)
    .map(([personalId, s]) => ({
      personalId,
      personalName: s.name,
      completedSales: s.completed,
      scheduledSales: s.scheduled,
      totalSales: s.completed + s.scheduled,
      cancelledSales: s.cancelled,
      grossRevenue: s.revenue,
      // Estimativa do quanto a MUVX captura por personal (split teórico 2% + R$ 3,99 fixo)
      // Não é receita real — para isso, ver o campo top-level muvxRevenueReal
      muvxRevenue: s.revenue * 0.02 + s.completed * MUVX_FEE_FIXED,
    }))
    .sort((a, b) => b.grossRevenue - a.grossRevenue || b.totalSales - a.totalSales)
    .slice(0, 10)

  // ── Checkins ────────────────────────────────────────────────────────────────
  const checkinsData: CheckinsData | null = rawCheckins ? {
    checkinSummary: {
      today:      rawCheckins.checkinSummary?.today      ?? 0,
      last7Days:  rawCheckins.checkinSummary?.last7Days  ?? 0,
      last30Days: rawCheckins.checkinSummary?.last30Days ?? 0,
      period:     rawCheckins.checkinSummary?.period     ?? 0,
    },
    studentEngagement: {
      totalStudents:              rawCheckins.studentEngagement?.totalStudents              ?? 0,
      activeStudents:             rawCheckins.studentEngagement?.activeStudents             ?? 0,
      inactiveStudents:           rawCheckins.studentEngagement?.inactiveStudents           ?? 0,
      newStudents:                rawCheckins.studentEngagement?.newStudents                ?? 0,
      averageCheckinsPerStudent:  rawCheckins.studentEngagement?.averageCheckinsPerStudent  ?? 0,
      activePercentage:           rawCheckins.studentEngagement?.activePercentage           ?? 0,
    },
    weeklyGoalAchievement: {
      studentsWhoMetGoal:    rawCheckins.weeklyGoalAchievement?.studentsWhoMetGoal    ?? 0,
      totalStudentsWithGoal: rawCheckins.weeklyGoalAchievement?.totalStudentsWithGoal ?? 0,
      achievementRate:       rawCheckins.weeklyGoalAchievement?.achievementRate       ?? 0,
    },
    topActivities: (rawCheckins.topActivities ?? []).map(a => ({
      activity:   a.activity   ?? '',
      count:      a.count      ?? 0,
      percentage: a.percentage ?? 0,
    })),
    dayOfWeekDistribution: (rawCheckins.dayOfWeekDistribution ?? []).map(d => ({
      dayOfWeek:  d.dayOfWeek  ?? 0,
      dayName:    d.dayName    ?? '',
      count:      d.count      ?? 0,
      percentage: d.percentage ?? 0,
    })),
    dailyHistory: (rawCheckins.dailyHistory ?? []).map(d => ({
      date:  d.date  ?? '',
      count: d.count ?? 0,
    })),
  } : null

  const recentPurchases: Purchase[] = rawPurchases.slice(0, 10).map(p => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'UNKNOWN',
    createdAt: p.createdAt ?? null,
    paymentMethod: p.paymentMethod ?? null,
    planName: p.originalProduct?.name ?? null,
    billingType: p.billingType ?? null,
    recurrenceInterval: p.recurrenceInterval ?? null,
    cancellationReason: p.cancellationReason ?? null,
    cancelledBy: p.cancelledBy ?? null,
    cancelledAt: p.cancelledAt ?? null,
  }))

  const response: MetricsResponse = {
    fetchedAt: new Date().toISOString(),
    totalUsers, totalStudents, totalPersonals,
    periodStudents, periodPersonals,
    activeUsers: activeUsersWithProfile, inactiveUsers, activePersonals, activeStudents,
    usersGrowthLastMonth, studentsGrowthLastMonth, personalsGrowthLastMonth,
    crefVerified, crefPending, crefApprovalRate,
    revenueInPeriod, muvxRevenue, muvxRevenueReal, muvxRevenueEstimated,
    muvxRevenueWithdrawn, muvxRevenuePending, muvxWithdrawalsCount,
    muvxRevenuePaid, muvxRevenueWaiting, muvxRevenueNet,
    muvxRevenueScheduled, muvxRevenueExpired, muvxRevenueCancelled,
    muvxRevenueAnnualProjected, muvxRevenueMonthlyProjected, volumeAnualProjetado,
    volumeAnualPeriodo, cobrancasAnualPeriodo, muvxRevenuePeriodAnnualProjected,
    muvxBalanceAvailable, muvxBalanceWaitingFunds, muvxBalanceTransferred,
    gmvPaid, gmvExpired, gmvCancelled, muvxShareObserved,
    transactionsMissingSplit, transactionsWithoutRecord,
    pagarmeRepasse, pagarmeAvailable, purchasesTotal,
    completedSales, scheduledSales, scheduledRevenue, cancelledSales, realizedSales,
    avgTicket, avgTicketDigital, avgTicketPresential,
    digitalSales: digitalCount, presentialSales: presentialCount,
    checkoutSales, checkoutRevenue, checkoutPurchases,
    ltv, salesVelocity, projectedMonthRevenue,
    purchasesByStatus, purchasesByStatusDetail, recentPurchases,
    recurringCount, oneTimeCount, recurringRevenue, oneTimeRevenue,
    paymentMethodBreakdown, recurrenceBreakdown,
    churnRate, inactivePersonals, activationRate,
    funnelRegistered: totalPersonals,
    funnelWithProduct: personalsWithProduct,
    funnelWithSale: personalsWithSale,
    funnelStages,
    avgRating, totalRatedPersonals,
    personalsWithProduct, personalsWithSale, personalsWithSaleInPeriod, personalsWithSaleTotal,
    personalsWithProductList, personalsWithSaleList, allPurchasesInPeriod,
    topPersonals, topStudents, topPlans,
    salesByWeekday, dailyHeatmap,
    conversionRate, conversionRateHistorical,
    checkinsData,
    errors,
  }

  return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } })
}
