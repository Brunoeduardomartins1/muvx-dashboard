export interface Purchase {
  id: string
  studentName: string | null
  personalName: string | null
  amount: number
  status: string
  createdAt: string | null
  paymentMethod: string | null
  planName: string | null
}

export interface TopPersonal {
  personalId: string
  personalName: string
  completedSales: number    // COMPLETED
  scheduledSales: number    // SCHEDULED
  totalSales: number        // completed + scheduled
  cancelledSales: number
  grossRevenue: number      // soma dos totalAmount das vendas concluídas
  muvxRevenue: number       // (grossRevenue * 0.02) + (completedSales * 3.99)
}

export interface MetricsResponse {
  fetchedAt: string

  // Totais
  totalUsers: number
  totalStudents: number
  totalPersonals: number

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

  // Financeiro
  revenueInPeriod: number       // soma das vendas concluídas (COMPLETED)
  muvxRevenue: number           // faturamento MUVX = (revenueInPeriod * 0.02) + (completedCount * 3.99)
  purchasesTotal: number        // total geral de compras (paginação)
  completedSales: number        // vendas COMPLETED
  scheduledSales: number        // vendas SCHEDULED (aguardando data de pagamento)
  scheduledRevenue: number      // soma dos valores das vendas SCHEDULED
  cancelledSales: number        // vendas CANCELLED + CANCELLED_BY_STUDENT + CANCELLED_BY_PERSONAL
  purchasesByStatus: Record<string, number>
  purchasesByStatusDetail: Record<string, Purchase[]>  // lista completa por status para drill-down
  recentPurchases: Purchase[]

  // Engajamento de personais
  personalsWithProduct: number  // personais que criaram ao menos 1 produto
  personalsWithSale: number     // personais que realizaram ao menos 1 venda

  // Top personais
  topPersonals: TopPersonal[]

  // Conversão: personais cadastrados vs personais que venderam
  conversionRate: number        // personalsWithSale / totalPersonals * 100

  // Erros parciais
  errors: string[]
}

export type MetricsError = {
  message: string
  code?: number
}
