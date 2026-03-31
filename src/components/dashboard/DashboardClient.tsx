'use client'

import { useState } from 'react'
import {
  Users, UserCheck, DollarSign, TrendingUp, XCircle, Clock,
  Package, ShoppingCart, Percent, Star, Activity, TrendingDown, BarChart2,
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
import { MuvxRevenueCard } from './MuvxRevenueCard'
import { FunnelCard } from './FunnelCard'
import { WeeklySalesChart } from './WeeklySalesChart'
import { PaymentMethodChart } from './PaymentMethodChart'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { DrillDownModal } from '@/components/ui/DrillDownModal'
import type { Purchase, PersonalRow } from '@/lib/types'

interface ModalState {
  kind: 'purchases' | 'personals'
  title: string
  subtitle?: string
  items: Purchase[] | PersonalRow[]
}

const REVENUE_GOAL = Number(process.env.NEXT_PUBLIC_MUVX_GOAL ?? 50000)

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
  function openPersonalsModal(title: string, subtitle: string, items: PersonalRow[]) {
    setModal({ kind: 'personals', title, subtitle, items })
  }

  return (
    <div className="min-h-screen transition-colors duration-250" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Header lastUpdated={lastUpdated} isLoading={isLoading} onRefresh={refresh} />

      <main className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">

        {/* Filtro de período */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <span className="text-xs font-sans font-600 uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Período</span>
          <PeriodFilter period={period} onSelectPreset={selectPreset} onSelectCustom={selectCustom} />
        </section>

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
                sublabel={`${data?.totalPersonals ?? 0} total histórico · ${data?.crefPending ?? 0} CREF pend.`}
                onClick={() => openPersonalsModal('Personais no Período', 'Personais cadastrados no período', data?.personalsWithProductList ?? [])} />
              <StatCard dark label="Total Geral de Usuários" value={data?.totalUsers ?? 0} delta={data?.usersGrowthLastMonth} icon={<Users size={16} />}
                sublabel={`${data?.activeUsers ?? 0} ativos · ${data?.inactiveUsers ?? 0} inativos`}
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
              <StatCard label="Personais com Venda" value={data?.personalsWithSale ?? 0} icon={<ShoppingCart size={16} />}
                sublabel={`no período · ${data?.personalsWithSaleTotal ?? 0} total histórico`}
                onClick={() => openPersonalsModal('Personais com Venda no Período', 'Ao menos 1 venda no período', data?.personalsWithSaleList ?? [])} />
              <StatCard label="Conversão de Personais" value={data?.conversionRate ?? 0} format="number" icon={<Percent size={16} />}
                sublabel={`${data?.personalsWithSale ?? 0} venderam · ${data?.personalsWithSaleTotal ?? 0} histórico`}
                onClick={() => openPersonalsModal('Conversão — Personais', 'Personais com venda no período', data?.personalsWithSaleList ?? [])} />
            </>
          )}
        </section>

        {/* ── Row 3 — Vendas e Financeiro ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {showSkeletons ? (<><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /></>) : (
            <>
              <StatCard dark label="Vendas Realizadas" value={data?.completedSales ?? 0} icon={<TrendingUp size={16} />}
                sublabel={`${data?.purchasesTotal ?? 0} total de compras`}
                onClick={() => openPurchasesModal('Vendas Realizadas', 'Compras com status Concluído', ['COMPLETED'])} />
              <StatCard dark label="Ag. Data Pagamento" value={data?.scheduledRevenue ?? 0} format="currency" icon={<Clock size={16} />}
                sublabel={`${data?.scheduledSales ?? 0} vendas agendadas`}
                onClick={() => openPurchasesModal('Aguardando Pagamento', 'Compras agendadas para cobrança futura', ['SCHEDULED'])} />
              <StatCard dark label="Vendas Canceladas" value={data?.cancelledSales ?? 0} icon={<XCircle size={16} />}
                onClick={() => openPurchasesModal('Vendas Canceladas', 'Canceladas pelo personal, aluno ou sistema', ['CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_PERSONAL'])} />
              <StatCard dark label="Vendas Transacionadas" value={data?.revenueInPeriod ?? 0} format="currency" icon={<DollarSign size={16} />}
                sublabel={`${data?.completedSales ?? 0} vendas concluídas`}
                onClick={() => openPurchasesModal('Vendas Transacionadas', 'Todas as compras concluídas no período', ['COMPLETED'])} />
            </>
          )}
        </section>

        {/* ── Row 4 — Retenção, Qualidade, Ticket ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {showSkeletons ? (<><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>) : (
            <>
              <StatCard label="Churn Rate" value={data?.churnRate ?? 0} format="number" icon={<TrendingDown size={16} />}
                sublabel={`${data?.cancelledSales ?? 0} cancelamentos no período`}
                onClick={() => openPurchasesModal('Vendas Canceladas', 'Todas as canceladas no período', ['CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_PERSONAL'])} />
              <StatCard label="Ticket Médio" value={data?.avgTicket ?? 0} format="currency" icon={<BarChart2 size={16} />}
                sublabel={`${data?.completedSales ?? 0} vendas concluídas`}
                onClick={() => openPurchasesModal('Vendas — Ticket Médio', 'Compras concluídas no período', ['COMPLETED'])} />
              <StatCard label="Taxa de Ativação CREF" value={data?.crefApprovalRate ?? 0} format="number" icon={<Activity size={16} />}
                sublabel={`${data?.crefVerified ?? 0} verificados · ${data?.crefPending ?? 0} pendentes`} />
              <StatCard label="Avaliação Média" value={data?.avgRating ?? 0} format="number" icon={<Star size={16} />}
                sublabel={`${data?.totalRatedPersonals ?? 0} personais avaliados`} />
            </>
          )}
        </section>

        {/* ── Card grande — Faturamento MUVX ── */}
        <section>
          <MuvxRevenueCard
            muvxRevenue={data?.muvxRevenue ?? 0}
            revenueInPeriod={data?.revenueInPeriod ?? 0}
            completedSales={data?.completedSales ?? 0}
            isLoading={showSkeletons}
          />
        </section>

        {/* ── Row 5 — Gráficos de análise ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BarChartComponent purchasesByStatus={data?.purchasesByStatus ?? {}} isLoading={showSkeletons} />
          <ConversionRing rate={data?.conversionRate ?? 0} isLoading={showSkeletons} />
          <GoalGauge revenue={data?.revenueInPeriod ?? 0} goal={REVENUE_GOAL} isLoading={showSkeletons} />
        </section>

        {/* ── Row 6 — Funil + Método pagamento + Dias da semana ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FunnelCard
            registered={data?.funnelRegistered ?? 0}
            withProduct={data?.funnelWithProduct ?? 0}
            withSale={data?.funnelWithSale ?? 0}
            isLoading={showSkeletons}
          />
          <PaymentMethodChart
            breakdown={data?.paymentMethodBreakdown ?? {}}
            recurrenceBreakdown={data?.recurrenceBreakdown ?? {}}
            isLoading={showSkeletons}
          />
          <WeeklySalesChart data={data?.salesByWeekday ?? []} isLoading={showSkeletons} />
        </section>

        {/* ── Row 7 — Pipeline + Tabela de compras ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineBar purchasesByStatus={data?.purchasesByStatus ?? {}} totalPersonals={data?.totalPersonals ?? 0} crefPending={data?.crefPending ?? 0} isLoading={showSkeletons} />
          <DataTable purchases={data?.recentPurchases ?? []} isLoading={showSkeletons} />
        </section>

        {/* ── Row 8 — Top Personais + Top Alunos ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TopPersonais topPersonals={data?.topPersonals ?? []} isLoading={showSkeletons} />
          </div>
          <TopStudents topStudents={data?.topStudents ?? []} isLoading={showSkeletons} />
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
