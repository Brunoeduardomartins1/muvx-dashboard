'use client'

import { useState } from 'react'
import {
  Users, UserCheck, DollarSign, TrendingUp, XCircle, Clock,
  Package, ShoppingCart, Percent, Star, TrendingDown, CreditCard,
} from 'lucide-react'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { usePeriod } from '@/hooks/usePeriod'
import { Header } from './Header'
import { PeriodFilter } from './PeriodFilter'
import { StatCard } from './StatCard'
import { BarChartComponent } from './BarChartComponent'
import { ConversionRing } from './ConversionRing'
import { GoalGauge } from './GoalGauge'
import { PipelineBar } from './PipelineBar'
import { DataTable } from './DataTable'
import { TopPersonais } from './TopPersonais'
import { TopStudents } from './TopStudents'
import { TopPlans } from './TopPlans'
import { MuvxRevenueCard } from './MuvxRevenueCard'
import { FunnelCard } from './FunnelCard'
import { WeeklySalesChart } from './WeeklySalesChart'
import { PaymentMethodChart } from './PaymentMethodChart'
import { VelocityCards } from './VelocityCards'
import { AvgTicketCard } from './AvgTicketCard'
import { AlertBanner } from './AlertBanner'
import { HeatmapChart } from './HeatmapChart'
import { CheckinsSection } from './CheckinsSection'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { DrillDownModal } from '@/components/ui/DrillDownModal'
import type { Purchase, PersonalRow } from '@/lib/types'

interface ModalState {
  kind: 'purchases' | 'personals'
  title: string
  subtitle?: string
  items: Purchase[] | PersonalRow[]
}

const REVENUE_GOAL = Number(process.env.NEXT_PUBLIC_MUVX_GOAL ?? 10000)

export function DashboardClient() {
  const { period, selectPreset, selectCustom } = usePeriod()
  const { data, isLoading, isError, lastUpdated, refresh } = useAutoRefresh({ from: period.from, to: period.to })
  const [modal, setModal] = useState<ModalState | null>(null)
  const showSkeletons = isLoading && !data

  function openPurchasesModal(title: string, subtitle: string, statuses: string[]) {
    const detail = data?.purchasesByStatusDetail ?? {}
    const items = statuses.flatMap(s => detail[s] ?? [])
    setModal({ kind: 'purchases', title, subtitle, items })
  }
  function openAllPurchasesModal(title: string, subtitle: string) {
    setModal({ kind: 'purchases', title, subtitle, items: data?.allPurchasesInPeriod ?? [] })
  }
  function openCheckoutModal() {
    setModal({ kind: 'purchases', title: 'Vendas via Checkout / Renovação', subtitle: 'Alunos cadastrados pelo checkout — pagas ou agendadas no período', items: data?.checkoutPurchases ?? [] })
  }
  function openPersonalsModal(title: string, subtitle: string, items: PersonalRow[]) {
    setModal({ kind: 'personals', title, subtitle, items })
  }

  return (
    <div className="min-h-screen transition-colors duration-250" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Header lastUpdated={lastUpdated} isLoading={isLoading} onRefresh={refresh} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* Filtro de período */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <span className="text-xs font-sans font-600 uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Período</span>
          <PeriodFilter period={period} onSelectPreset={selectPreset} onSelectCustom={selectCustom} />
        </section>

        {/* Alertas automáticos */}
        {data && (
          <AlertBanner
            churnRate={data.churnRate}
            inactivePersonals={data.inactivePersonals}
            completedSales={data.completedSales}
            avgRating={data.avgRating}
          />
        )}

        {isError && !data && (
          <div className="rounded-xl px-6 py-3 flex items-center gap-2" style={{ border: '1px solid rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#EF4444' }} />
            <p className="text-sm font-sans" style={{ color: '#EF4444' }}>Não foi possível conectar à API MUVX. Verifique as variáveis de ambiente.</p>
          </div>
        )}
        {data?.errors && data.errors.length > 0 && (
          <div className="rounded-xl px-6 py-3" style={{ border: '1px solid rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.05)' }}>
            <p className="text-xs font-sans" style={{ color: '#F59E0B' }}>Dados parciais: {data.errors.join(' · ')}</p>
          </div>
        )}

        {/* ── Row 1 — Usuários ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showSkeletons ? (<><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /></>) : (
            <>
              <StatCard dark label="Alunos no Período" value={data?.periodStudents ?? 0} icon={<Users size={16} />}
                sublabel={`${data?.totalStudents ?? 0} total histórico`}
                onClick={() => openAllPurchasesModal('Compras de Alunos', 'Todas as compras no período')} />
              <StatCard dark label="Personais no Período" value={data?.periodPersonals ?? 0} delta={data?.personalsGrowthLastMonth} icon={<UserCheck size={16} />}
                sublabel={`${data?.totalPersonals ?? 0} total histórico`}
                onClick={() => openPersonalsModal('Personais no Período', 'Personais cadastrados no período', data?.personalsWithProductList ?? [])} />
              <StatCard dark label="Usuários Ativos" value={data?.activeUsers ?? 0} delta={data?.usersGrowthLastMonth} icon={<Users size={16} />}
                sublabel={`${data?.activePersonals ?? 0} personais · ${data?.activeStudents ?? 0} alunos`}
                onClick={() => openAllPurchasesModal('Todas as Compras', 'Total de compras no período')} />
            </>
          )}
        </section>

        {/* ── Row 2 — Engajamento de Personais ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showSkeletons ? (<><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>) : (
            <>
              <StatCard label="Personais com Produto" value={data?.personalsWithProduct ?? 0} icon={<Package size={16} />}
                sublabel={`de ${data?.totalPersonals ?? 0} na plataforma`}
                onClick={() => openPersonalsModal('Personais com Produto', 'Ao menos 1 produto cadastrado', data?.personalsWithProductList ?? [])} />
              <StatCard label="Quantos Personais Venderam" value={data?.personalsWithSaleTotal ?? 0} icon={<ShoppingCart size={16} />}
                sublabel={`${data?.personalsWithSaleInPeriod ?? 0} com venda no período`}
                onClick={() => openPersonalsModal('Personais que Venderam', 'Ao menos 1 venda no histórico', data?.personalsWithSaleList ?? [])} />
              <StatCard label="Conversão de Personais" value={data?.conversionRate ?? 0} format="number" icon={<Percent size={16} />}
                sublabel={`${(data?.conversionRateHistorical ?? 0).toFixed(1)}% histórico`}
                onClick={() => openPersonalsModal('Conversão — Personais', 'Personais com venda concluída no período', data?.personalsWithSaleList ?? [])} />
            </>
          )}
        </section>

        {/* ── Row 3 — Vendas e Financeiro ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {showSkeletons ? (<><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /></>) : (
            <>
              <StatCard dark label="Vendas Realizadas" value={data?.realizedSales ?? 0} icon={<TrendingUp size={16} />}
                sublabel={`${data?.completedSales ?? 0} pagas · ${data?.scheduledSales ?? 0} agendadas`}
                onClick={() => openPurchasesModal('Vendas Realizadas', 'Compras pagas ou agendadas no período', ['COMPLETED', 'SCHEDULED'])} />
              <StatCard dark label="Aguardando Pagamento" value={data?.scheduledRevenue ?? 0} format="currency" icon={<Clock size={16} />}
                sublabel={`${data?.scheduledSales ?? 0} vendas agendadas no período`}
                onClick={() => openPurchasesModal('Aguardando Pagamento', 'Vendas realizadas no período, aguardando cobrança futura', ['SCHEDULED'])} />
              <StatCard dark label="Vendas Canceladas" value={data?.cancelledSales ?? 0} icon={<XCircle size={16} />}
                onClick={() => openPurchasesModal('Vendas Canceladas', 'Canceladas, expiradas ou reembolsadas', ['CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_PERSONAL', 'EXPIRED', 'INACTIVE', 'REFUNDED'])} />
              <StatCard dark label="Vendas Transacionadas" value={data?.revenueInPeriod ?? 0} format="currency" icon={<DollarSign size={16} />}
                sublabel={`${data?.completedSales ?? 0} vendas já pagas`}
                onClick={() => openPurchasesModal('Vendas Transacionadas', 'Vendas já pagas no período', ['COMPLETED'])} />
            </>
          )}
        </section>

        {/* ── Row 3.5 — Vendas via Checkout/Renovação ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showSkeletons ? (<><StatCardSkeleton /><StatCardSkeleton /></>) : (
            <>
              <StatCard label="Vendas via Checkout / Renovação" value={data?.checkoutSales ?? 0} icon={<CreditCard size={16} />}
                sublabel="Alunos cadastrados pelo checkout — pagas ou agendadas no período"
                onClick={openCheckoutModal} />
              <StatCard label="Receita via Checkout / Renovação" value={data?.checkoutRevenue ?? 0} format="currency" icon={<CreditCard size={16} />}
                sublabel={`${data?.checkoutSales ?? 0} vendas`}
                onClick={openCheckoutModal} />
            </>
          )}
        </section>

        {/* ── Row 4 — Retenção, Qualidade, Ticket ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showSkeletons ? (<><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>) : (
            <>
              <StatCard label="Churn Rate" value={data?.churnRate ?? 0} format="number" icon={<TrendingDown size={16} />}
                sublabel={`${data?.cancelledSales ?? 0} cancelamentos no período`}
                onClick={() => openPurchasesModal('Vendas Canceladas', 'Todas as canceladas no período', ['CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_PERSONAL'])} />
              <AvgTicketCard
                avgTicket={data?.avgTicket ?? 0}
                avgTicketDigital={data?.avgTicketDigital ?? 0}
                avgTicketPresential={data?.avgTicketPresential ?? 0}
                realizedSales={data?.realizedSales ?? 0}
                digitalSales={data?.digitalSales ?? 0}
                presentialSales={data?.presentialSales ?? 0}
                onClick={() => openPurchasesModal('Vendas — Ticket Médio', 'Pagas + agendadas no período', ['COMPLETED', 'SCHEDULED'])} />
              <StatCard label="Avaliação Média" value={data?.avgRating ?? 0} format="number" icon={<Star size={16} />}
                sublabel={`${data?.totalRatedPersonals ?? 0} personais avaliados`} />
            </>
          )}
        </section>

        {/* ── Row 5 — LTV + Velocidade + Projeção ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VelocityCards
            ltv={data?.ltv ?? 0}
            salesVelocity={data?.salesVelocity ?? 0}
            projectedMonthRevenue={data?.projectedMonthRevenue ?? 0}
            periodStudents={data?.periodStudents ?? 0}
            isLoading={showSkeletons}
          />
        </section>

        {/* ── Card grande — Faturamento MUVX ── */}
        <section>
          <MuvxRevenueCard
            muvxRevenueNet={data?.muvxRevenueNet ?? 0}
            muvxRevenuePaid={data?.muvxRevenuePaid ?? 0}
            muvxRevenueWaiting={data?.muvxRevenueWaiting ?? 0}
            muvxBalanceAvailable={data?.muvxBalanceAvailable ?? 0}
            muvxBalanceWaitingFunds={data?.muvxBalanceWaitingFunds ?? 0}
            muvxBalanceTransferred={data?.muvxBalanceTransferred ?? 0}
            muvxShareObserved={data?.muvxShareObserved ?? 0}
            revenueInPeriod={data?.revenueInPeriod ?? 0}
            scheduledRevenue={data?.scheduledRevenue ?? 0}
            pagarmeAvailable={data?.pagarmeAvailable ?? false}
            isLoading={showSkeletons}
          />
        </section>

        {/* ── Row 6 — Gráficos de análise ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BarChartComponent purchasesByStatus={data?.purchasesByStatus ?? {}} isLoading={showSkeletons} />
          <ConversionRing rate={data?.conversionRate ?? 0} isLoading={showSkeletons} />
          <GoalGauge revenue={data?.revenueInPeriod ?? 0} goal={REVENUE_GOAL} isLoading={showSkeletons} />
        </section>

        {/* ── Row 7 — Funil + Método pagamento + Dias da semana ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FunnelCard
            stages={data?.funnelStages ?? []}
            isLoading={showSkeletons}
          />
          <PaymentMethodChart
            breakdown={data?.paymentMethodBreakdown ?? {}}
            recurrenceBreakdown={data?.recurrenceBreakdown ?? {}}
            isLoading={showSkeletons}
          />
          <WeeklySalesChart data={data?.salesByWeekday ?? []} isLoading={showSkeletons} />
        </section>

        {/* ── Row 8 — Mapa de calor ── */}
        <section>
          <HeatmapChart data={data?.dailyHeatmap ?? []} isLoading={showSkeletons} />
        </section>

        {/* ── Row 9 — Pipeline + Tabela de compras ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineBar purchasesByStatus={data?.purchasesByStatus ?? {}} totalPersonals={data?.totalPersonals ?? 0} isLoading={showSkeletons} />
          <DataTable purchases={data?.recentPurchases ?? []} isLoading={showSkeletons} />
        </section>

        {/* ── Row 10 — Top Personais + Top Alunos ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TopPersonais topPersonals={data?.topPersonals ?? []} isLoading={showSkeletons} />
          </div>
          <TopStudents topStudents={data?.topStudents ?? []} isLoading={showSkeletons} />
        </section>

        {/* ── Row 11 — Top Planos ── */}
        <section>
          <TopPlans topPlans={data?.topPlans ?? []} isLoading={showSkeletons} />
        </section>

        {/* ── Row 12 — Engajamento & Check-ins ── */}
        <section>
          <CheckinsSection data={data?.checkinsData ?? null} isLoading={showSkeletons} />
        </section>

      </main>

      {modal && (
        <DrillDownModal
          kind={modal.kind as 'purchases' | 'personals'}
          title={modal.title}
          subtitle={modal.subtitle}
          items={modal.items as Purchase[] & PersonalRow[]}
          onClose={() => setModal(null)}
        />
      )}

      <footer className="text-center py-6">
        <p className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
          MUVX Dashboard · {period.label} · Atualização automática a cada hora
        </p>
      </footer>
    </div>
  )
}
