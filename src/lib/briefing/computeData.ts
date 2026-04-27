import type { MetricsResponse, Purchase, TopPersonal, DailyHeatmapPoint } from '@/lib/types'

export interface ComparisonRow {
  label: string
  lastMonth: number
  thisMonth: number
  deltaPercent: number
  format: 'currency' | 'integer'
}

export interface BriefingData {
  // Datas formatadas
  todayLabel: string         // "28/abr"
  yesterdayLabel: string     // "27/abr"
  monthLabel: string         // "abr"
  lastMonthLabel: string     // "mar"
  fetchedAt: string          // ISO

  // Manchete
  goal: number
  mtdRevenueMuvx: number
  goalProgressPercent: number

  // Meta diária (cálculo de pace)
  daysElapsedInMonth: number      // dias já decorridos do mês (até ontem inclusive)
  daysRemainingInMonth: number    // dias que faltam (hoje incluído)
  dailyGoalRequired: number       // R$/dia que precisa fazer DAQUI até o fim do mês para bater a meta
  dailyPaceCurrent: number        // R$/dia que JÁ está fazendo na média (receita MTD ÷ dias decorridos)
  goalIsAchieved: boolean         // true se já passou a meta

  // Entrada
  newPersonalsD1: number
  newPersonalsMTD: number
  newPersonalsLastMonthSameDay: number
  newPersonalsDeltaPercent: number
  percentWithProductMTD: number
  percentWithStudentMTD: number

  // Vendas
  salesD1: number
  gmvD1: number
  revenueMuvxD1: number
  salesMTD: number
  gmvMTD: number
  avgTicketMTD: number

  // Sparkline diário (GMV por dia desde início do mês até ontem)
  dailySparkline: DailyHeatmapPoint[]
  dailyMaxRevenue: number  // pico para escalar barras

  // Comparativo M-1 vs M
  comparisonRows: ComparisonRow[]

  // Base ativa (estado atual — não tem janela)
  activeSubscriptionsCount: number      // total de assinaturas com status ACTIVE
  mrrEstimated: number                   // muvxRevenueMonthlyProjected

  // Pipeline até fechar o mês (hoje → último dia do mês)
  untilEomScheduledCount: number              // cobranças SCHEDULED com nextBilling em [hoje, fim do mês]
  untilEomScheduledRevenue: number            // soma de totalAmount dessas cobranças (GMV bruto previsto)
  untilEomMuvxRevenueProjected: number        // projeção de receita líquida MUVX = GMV agendado * share médio MTD
  muvxShareObserved: number                   // share observado MTD (receita líquida / volume) — para referência
  daysUntilEom: number                        // quantos dias até fechar o mês (incluindo hoje)

  // Detalhe (PDF)
  topPersonalsMTD: TopPersonal[]
  newPersonalsPendingProduct: Array<{ name: string; createdAt: string }>
}

interface ComputeInput {
  d1Metrics: MetricsResponse
  mtdMetrics: MetricsResponse
  lastMonthSameDayMetrics: MetricsResponse
  untilEomMetrics: MetricsResponse | null  // SCHEDULED na janela hoje→fim do mês
  newPersonalsMonth: Array<{
    id: string
    name: string
    createdAt: string
    hasProduct: boolean
    hasStudent: boolean
  }>
  goal: number
  yesterdayISO: string
  todayISO: string
}

const MONTH_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(d, 10)}/${MONTH_PT[parseInt(m, 10) - 1]}`
}

function pct(part: number, total: number): number {
  if (!total) return 0
  return (part / total) * 100
}

function delta(curr: number, prev: number): number {
  if (!prev) return 0
  return ((curr - prev) / prev) * 100
}

export function computeBriefingData(input: ComputeInput): BriefingData {
  const { d1Metrics, mtdMetrics, lastMonthSameDayMetrics, untilEomMetrics, newPersonalsMonth, goal, yesterdayISO, todayISO } = input

  const todayLabel = shortDate(todayISO)
  const yesterdayLabel = shortDate(yesterdayISO)
  const monthIdx = parseInt(todayISO.split('-')[1], 10) - 1
  const monthLabel = MONTH_PT[monthIdx]
  const lastMonthLabel = MONTH_PT[(monthIdx + 11) % 12]

  // Manchete
  const mtdRevenueMuvx = mtdMetrics.muvxRevenuePaid + mtdMetrics.muvxRevenueWaiting
  const goalProgressPercent = pct(mtdRevenueMuvx, goal)

  // Meta diária — calcula pace atual e quanto precisa por dia daqui em diante
  // Janela MTD = 1º do mês até ontem. Hoje ainda não fechou, então hoje conta como "dia restante".
  const todayDay = parseInt(todayISO.split('-')[2], 10)
  const todayYear = parseInt(todayISO.split('-')[0], 10)
  const todayMonth1Based = parseInt(todayISO.split('-')[1], 10)
  // Último dia do mês corrente (data 0 do mês seguinte = último dia do mês atual)
  const daysInMonth = new Date(Date.UTC(todayYear, todayMonth1Based, 0)).getUTCDate()
  const daysElapsedInMonth = Math.max(1, todayDay - 1)             // dias FECHADOS (= dias com receita MTD)
  const daysRemainingInMonth = Math.max(1, daysInMonth - todayDay + 1) // hoje + futuros
  const remainingToGoal = Math.max(0, goal - mtdRevenueMuvx)
  const dailyGoalRequired = remainingToGoal / daysRemainingInMonth
  const dailyPaceCurrent = mtdRevenueMuvx / daysElapsedInMonth
  const goalIsAchieved = mtdRevenueMuvx >= goal

  // Entrada
  const newPersonalsD1 = d1Metrics.periodPersonals
  const newPersonalsMTD = mtdMetrics.periodPersonals
  const newPersonalsLastMonthSameDay = lastMonthSameDayMetrics.periodPersonals
  const newPersonalsDeltaPercent = delta(newPersonalsMTD, newPersonalsLastMonthSameDay)

  const totalNewMonth = newPersonalsMonth.length
  const percentWithProductMTD = pct(newPersonalsMonth.filter(p => p.hasProduct).length, totalNewMonth)
  const percentWithStudentMTD = pct(newPersonalsMonth.filter(p => p.hasStudent).length, totalNewMonth)

  // Vendas
  const salesD1 = d1Metrics.completedSales
  const gmvD1 = d1Metrics.gmvPaid
  const revenueMuvxD1 = d1Metrics.muvxRevenuePaid + d1Metrics.muvxRevenueWaiting
  const salesMTD = mtdMetrics.completedSales
  const gmvMTD = mtdMetrics.gmvPaid
  const avgTicketMTD = mtdMetrics.avgTicket

  // Sparkline
  const dailySparkline = (mtdMetrics.dailyHeatmap ?? [])
    .slice() // copy
    .sort((a, b) => a.date.localeCompare(b.date))
  const dailyMaxRevenue = dailySparkline.reduce((max, d) => d.revenue > max ? d.revenue : max, 0)

  // Comparativo M-1 vs M
  const lastMonthRevenueMuvx = lastMonthSameDayMetrics.muvxRevenuePaid + lastMonthSameDayMetrics.muvxRevenueWaiting
  const comparisonRows: ComparisonRow[] = [
    {
      label: 'Cadastros novos',
      lastMonth: lastMonthSameDayMetrics.periodPersonals,
      thisMonth: mtdMetrics.periodPersonals,
      deltaPercent: delta(mtdMetrics.periodPersonals, lastMonthSameDayMetrics.periodPersonals),
      format: 'integer',
    },
    {
      label: 'Vendas concluídas',
      lastMonth: lastMonthSameDayMetrics.completedSales,
      thisMonth: mtdMetrics.completedSales,
      deltaPercent: delta(mtdMetrics.completedSales, lastMonthSameDayMetrics.completedSales),
      format: 'integer',
    },
    {
      label: 'GMV',
      lastMonth: lastMonthSameDayMetrics.gmvPaid,
      thisMonth: mtdMetrics.gmvPaid,
      deltaPercent: delta(mtdMetrics.gmvPaid, lastMonthSameDayMetrics.gmvPaid),
      format: 'currency',
    },
    {
      label: 'Receita MUVX líq.',
      lastMonth: lastMonthRevenueMuvx,
      thisMonth: mtdRevenueMuvx,
      deltaPercent: delta(mtdRevenueMuvx, lastMonthRevenueMuvx),
      format: 'currency',
    },
    {
      label: 'Ticket médio',
      lastMonth: lastMonthSameDayMetrics.avgTicket,
      thisMonth: mtdMetrics.avgTicket,
      deltaPercent: delta(mtdMetrics.avgTicket, lastMonthSameDayMetrics.avgTicket),
      format: 'currency',
    },
  ]

  // Pipeline até fechar o mês — /api/metrics retorna scheduledSales/Revenue para a janela
  // passada (hoje → fim do mês), e scheduledRevenue é a soma de cobranças agendadas no período.
  const untilEomScheduledCount = untilEomMetrics?.scheduledSales ?? 0
  const untilEomScheduledRevenue = untilEomMetrics?.scheduledRevenue ?? 0
  // Share efetivo observado MTD: receita líquida / volume transacionado.
  // Usado para projetar quanto desses GMVs agendados vão virar receita líquida MUVX.
  const muvxShareObserved = mtdMetrics.muvxShareObserved ?? 0
  const untilEomMuvxRevenueProjected = untilEomScheduledRevenue * muvxShareObserved
  // daysUntilEom é o mesmo que daysRemainingInMonth calculado acima (hoje + futuros)
  const daysUntilEom = daysRemainingInMonth

  // ACTIVE count: o /api/metrics não expõe diretamente, mas purchasesByStatus.ACTIVE traz
  // o número de ACTIVE no período. Como queremos o total da base, usamos o do mtdMetrics
  // que indiretamente reflete o estado atual via purchasesByStatusDetail.
  // Melhor sinal disponível: muvxRevenueAnnualProjected / 12 = MRR; #ACTIVE só vem do raw.
  const activeSubscriptionsCount = (mtdMetrics.purchasesByStatusDetail?.ACTIVE?.length ?? mtdMetrics.purchasesByStatus?.ACTIVE ?? 0)
  const mrrEstimated = mtdMetrics.muvxRevenueMonthlyProjected ?? 0

  // PDF detail
  const topPersonalsMTD = (mtdMetrics.topPersonals ?? []).slice(0, 5)
  const newPersonalsPendingProduct = newPersonalsMonth
    .filter(p => !p.hasProduct)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 12)
    .map(p => ({ name: p.name, createdAt: p.createdAt }))

  return {
    todayLabel, yesterdayLabel, monthLabel, lastMonthLabel,
    fetchedAt: mtdMetrics.fetchedAt,
    goal, mtdRevenueMuvx, goalProgressPercent,
    daysElapsedInMonth, daysRemainingInMonth, dailyGoalRequired, dailyPaceCurrent, goalIsAchieved,
    newPersonalsD1, newPersonalsMTD, newPersonalsLastMonthSameDay, newPersonalsDeltaPercent,
    percentWithProductMTD, percentWithStudentMTD,
    salesD1, gmvD1, revenueMuvxD1, salesMTD, gmvMTD, avgTicketMTD,
    dailySparkline, dailyMaxRevenue,
    comparisonRows,
    activeSubscriptionsCount, mrrEstimated,
    untilEomScheduledCount, untilEomScheduledRevenue, untilEomMuvxRevenueProjected, muvxShareObserved, daysUntilEom,
    topPersonalsMTD,
    newPersonalsPendingProduct,
  }
}

// Tipo Purchase só usado no helper de export — manter import vivo
export type _PurchaseRef = Purchase

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatBRLShort(v: number): string {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  return `R$ ${v.toFixed(0)}`
}

export function formatPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

export function formatDelta(v: number): string {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

export function formatInt(v: number): string {
  return v.toLocaleString('pt-BR')
}
