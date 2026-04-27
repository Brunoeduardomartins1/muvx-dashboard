export interface Purchase {
  id: string
  studentName: string | null
  personalName: string | null
  amount: number
  status: string
  createdAt: string | null
  paymentMethod: string | null
  planName: string | null
  billingType: string | null
  recurrenceInterval: string | null
  cancellationReason: string | null
  cancelledBy: string | null
  cancelledAt: string | null
}

export interface PersonalRow {
  personalId: string
  personalName: string
  email: string | null
  productsCount: number
  salesCount: number
}

export interface TopPersonal {
  personalId: string
  personalName: string
  completedSales: number
  scheduledSales: number
  totalSales: number
  cancelledSales: number
  grossRevenue: number
  muvxRevenue: number
}

export interface TopStudent {
  studentId: string
  studentName: string
  totalSpent: number
  purchasesCount: number
}

export interface TopPlan {
  planName: string
  count: number
  revenue: number
}

export interface WeekdaySales {
  day: string
  count: number
  revenue: number
}

export interface DailyHeatmapPoint {
  date: string   // 'YYYY-MM-DD'
  count: number
  revenue: number
}

export interface FunnelStage {
  key: 'registered' | 'product' | 'invited' | 'sold_once' | 'sold_multi' | 'recurring'
  label: string
  count: number
}

export interface MetricsResponse {
  fetchedAt: string

  totalUsers: number
  totalStudents: number
  totalPersonals: number

  periodStudents: number
  periodPersonals: number

  activeUsers: number
  inactiveUsers: number
  activePersonals: number
  activeStudents: number

  usersGrowthLastMonth: number
  studentsGrowthLastMonth: number
  personalsGrowthLastMonth: number

  crefVerified: number
  crefPending: number
  crefApprovalRate: number

  revenueInPeriod: number
  // Receita MUVX — valores LÍQUIDOS (após taxas do gateway), via /payables do Pagar.me
  muvxRevenue: number             // receita líquida total do período
  muvxRevenuePaid: number         // payables status 'paid' ou 'prepaid' (já disponível)
  muvxRevenueWaiting: number      // payables status 'waiting_funds' (aguardando liberação)
  muvxRevenueNet: number          // = muvxRevenuePaid + muvxRevenueWaiting
  muvxRevenueScheduled: number    // projeção sobre cobranças agendadas do período (share observado)
  muvxRevenueExpired: number      // legado
  muvxRevenueCancelled: number    // legado
  muvxRevenueAnnualProjected: number   // receita MUVX projetada 12 meses (todas ACTIVE × recorrências)
  muvxRevenueMonthlyProjected: number  // receita MUVX mensal média projetada
  volumeAnualProjetado: number         // volume 12m projetado da base ACTIVE total
  // Projeção APENAS das vendas do período analisado (não base toda)
  volumeAnualPeriodo: number           // volume 12m projetado das vendas do período
  cobrancasAnualPeriodo: number        // número total de cobranças projetadas nos 12 meses
  muvxRevenuePeriodAnnualProjected: number  // receita MUVX projetada sobre vendas do período
  muvxRevenueWithdrawn: number    // histórico de transfers da MUVX (via /transfers)
  muvxRevenuePending: number      // alias de muvxRevenueWaiting
  muvxRevenueReal: number         // alias legado = muvxRevenueNet
  muvxRevenueEstimated: number    // alias legado = muvxRevenueNet
  muvxWithdrawalsCount: number
  // Saldo atual da conta MUVX no Pagar.me (independe do período)
  muvxBalanceAvailable: number    // disponível para transferir
  muvxBalanceWaitingFunds: number // aguardando liberação
  muvxBalanceTransferred: number  // histórico total transferido
  gmvPaid: number                 // GMV pago no período (via transactions)
  gmvExpired: number
  gmvCancelled: number
  muvxShareObserved: number       // receita líquida / volume transacionado
  transactionsMissingSplit: number
  transactionsWithoutRecord: number
  pagarmeRepasse: number
  pagarmeAvailable: boolean
  purchasesTotal: number
  completedSales: number
  scheduledSales: number
  scheduledRevenue: number
  cancelledSales: number
  realizedSales: number
  avgTicket: number
  avgTicketDigital: number
  avgTicketPresential: number
  digitalSales: number
  presentialSales: number
  checkoutSales: number
  checkoutRevenue: number
  checkoutPurchases: Purchase[]
  ltv: number
  salesVelocity: number
  projectedMonthRevenue: number

  purchasesByStatus: Record<string, number>
  purchasesByStatusDetail: Record<string, Purchase[]>
  recentPurchases: Purchase[]

  recurringCount: number
  oneTimeCount: number
  recurringRevenue: number
  oneTimeRevenue: number
  paymentMethodBreakdown: Record<string, number>
  recurrenceBreakdown: Record<string, number>

  churnRate: number
  inactivePersonals: number
  activationRate: number

  funnelRegistered: number
  funnelWithProduct: number
  funnelWithSale: number
  funnelStages: FunnelStage[]

  avgRating: number
  totalRatedPersonals: number

  personalsWithProduct: number
  personalsWithSale: number
  personalsWithSaleInPeriod: number
  personalsWithSaleTotal: number
  personalsWithProductList: PersonalRow[]
  personalsWithSaleList: PersonalRow[]
  allPurchasesInPeriod: Purchase[]

  topPersonals: TopPersonal[]
  topStudents: TopStudent[]
  topPlans: TopPlan[]

  salesByWeekday: WeekdaySales[]
  dailyHeatmap: DailyHeatmapPoint[]

  conversionRate: number
  conversionRateHistorical: number
  checkinsData: CheckinsData | null
  errors: string[]
}

export type MetricsError = {
  message: string
  code?: number
}

export interface CheckinSummary {
  today: number
  last7Days: number
  last30Days: number
  period: number
}

export interface StudentEngagement {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
  newStudents: number
  averageCheckinsPerStudent: number
  activePercentage: number
}

export interface WeeklyGoalAchievement {
  studentsWhoMetGoal: number
  totalStudentsWithGoal: number
  achievementRate: number
}

export interface TopActivity {
  activity: string
  count: number
  percentage: number
}

export interface CheckinDayOfWeek {
  dayOfWeek: number
  dayName: string
  count: number
  percentage: number
}

export interface CheckinDailyHistory {
  date: string
  count: number
}

export interface CheckinsData {
  checkinSummary: CheckinSummary
  studentEngagement: StudentEngagement
  weeklyGoalAchievement: WeeklyGoalAchievement
  topActivities: TopActivity[]
  dayOfWeekDistribution: CheckinDayOfWeek[]
  dailyHistory: CheckinDailyHistory[]
}
