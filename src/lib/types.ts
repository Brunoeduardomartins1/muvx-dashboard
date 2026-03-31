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

export interface WeekdaySales {
  day: string        // 'Dom' | 'Seg' | ... | 'Sáb'
  count: number
  revenue: number
}

export interface MetricsResponse {
  fetchedAt: string

  // Totais históricos (all-time)
  totalUsers: number
  totalStudents: number
  totalPersonals: number

  // Totais no período selecionado
  periodStudents: number
  periodPersonals: number

  // Usuários ativos/inativos
  activeUsers: number
  inactiveUsers: number

  // Crescimento vs mês anterior
  usersGrowthLastMonth: number
  studentsGrowthLastMonth: number
  personalsGrowthLastMonth: number

  // CREF
  crefVerified: number
  crefPending: number
  crefApprovalRate: number   // verified / (verified + pending) * 100

  // Financeiro
  revenueInPeriod: number
  muvxRevenue: number
  purchasesTotal: number
  completedSales: number
  scheduledSales: number
  scheduledRevenue: number   // MRR estimado (receita futura garantida)
  cancelledSales: number
  avgTicket: number          // revenueInPeriod / completedSales
  purchasesByStatus: Record<string, number>
  purchasesByStatusDetail: Record<string, Purchase[]>
  recentPurchases: Purchase[]

  // Billing type breakdown
  recurringCount: number     // RECURRING
  oneTimeCount: number       // ONE_TIME
  recurringRevenue: number
  oneTimeRevenue: number
  paymentMethodBreakdown: Record<string, number>   // PIX: 38, CREDIT_CARD: 20, ...
  recurrenceBreakdown: Record<string, number>      // MONTHLY: 39, QUARTERLY: 7, ...

  // Retenção e churn
  churnRate: number          // canceladas / (canceladas + concluídas) * 100
  inactivePersonals: number  // personais cadastrados há +30 dias sem nenhuma venda no período
  activationRate: number     // personaisComProduto / totalPersonals * 100

  // Funil: cadastrou → produto → venda
  funnelRegistered: number   // totalPersonals
  funnelWithProduct: number  // personalsWithProduct
  funnelWithSale: number     // personalsWithSale (período)

  // Ratings
  avgRating: number          // média de averageRating dos personais com rating
  totalRatedPersonals: number

  // Engajamento de personais
  personalsWithProduct: number
  personalsWithSale: number
  personalsWithSaleTotal: number
  personalsWithProductList: PersonalRow[]
  personalsWithSaleList: PersonalRow[]
  allPurchasesInPeriod: Purchase[]

  // Top personais e alunos
  topPersonals: TopPersonal[]
  topStudents: TopStudent[]

  // Vendas por dia da semana
  salesByWeekday: WeekdaySales[]

  // Conversão
  conversionRate: number

  // Erros parciais
  errors: string[]
}

export type MetricsError = {
  message: string
  code?: number
}
