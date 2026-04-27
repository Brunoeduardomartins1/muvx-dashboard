import type { BriefingData, ComparisonRow } from './computeData'
import { formatBRL, formatBRLShort, formatPct, formatDelta, formatInt } from './computeData'
import { getLogoAssets } from './logoAssets'

function escape(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function shortDate(iso: string): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso.slice(0, 10)
  return `${m[3]}/${m[2]}`
}

function dayOnly(iso: string): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso.slice(0, 10)
  return `${parseInt(m[3], 10)}`
}

function formatComparisonValue(v: number, format: ComparisonRow['format']): string {
  if (format === 'currency') return formatBRL(v)
  return formatInt(v)
}

function deltaColor(deltaPct: number, invertNegative = false): string {
  const isPositive = invertNegative ? deltaPct < 0 : deltaPct >= 0
  return isPositive ? 'var(--green-dark)' : 'var(--red)'
}

export function buildBriefingHtml(d: BriefingData): string {
  const goalProgress = Math.min(100, Math.max(0, d.goalProgressPercent))
  const logos = getLogoAssets()

  // Sparkline: 30 barras max, escala pelo pico
  const sparkBars = d.dailySparkline.slice(-31).map(p => {
    const h = d.dailyMaxRevenue > 0 ? Math.max(2, (p.revenue / d.dailyMaxRevenue) * 100) : 2
    return { day: dayOnly(p.date), revenue: p.revenue, count: p.count, heightPct: h }
  })

  const compRows = d.comparisonRows.map(r => `
    <tr>
      <td>${r.label}</td>
      <td style="text-align:right; color: var(--text-muted);">${formatComparisonValue(r.lastMonth, r.format)}</td>
      <td style="text-align:right; font-weight:600;">${formatComparisonValue(r.thisMonth, r.format)}</td>
      <td style="text-align:right; color:${deltaColor(r.deltaPercent)}; font-weight:600;">${formatDelta(r.deltaPercent)}</td>
    </tr>`).join('')

  const sparkBarsHtml = sparkBars.map(b => `
    <div class="spark-bar-wrap" title="Dia ${b.day}: ${formatBRL(b.revenue)} (${b.count} vendas)">
      <div class="spark-bar" style="height: ${b.heightPct}%;"></div>
      <div class="spark-day">${b.day}</div>
    </div>`).join('')

  const topRows = d.topPersonalsMTD.map((p, i) => `
    <tr>
      <td style="color:var(--text-muted);">${i + 1}</td>
      <td>${escape(p.personalName)}</td>
      <td style="text-align:right;">${p.completedSales + p.scheduledSales}</td>
      <td style="text-align:right; font-weight:600;">${formatBRL(p.grossRevenue)}</td>
    </tr>`).join('')

  const pendingRows = d.newPersonalsPendingProduct.map((p, i) => `
    <tr>
      <td style="color:var(--text-muted);">${i + 1}</td>
      <td>${escape(p.name)}</td>
      <td style="color: var(--text-muted); white-space:nowrap;">${shortDate(p.createdAt)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>MUVX · Briefing ${d.todayLabel}</title>
<style>
  :root {
    --green: #08F887;
    --green-dark: #059660;
    --green-subtle: rgba(8,248,135,.12);
    --green-surface: rgba(8,248,135,.06);
    --bg: #FAFAFA;
    --bg-warm: #F5F6F4;
    --surface: #FFFFFF;
    --border: #E5E7EB;
    --border-soft: #EEF0EE;
    --text: #111827;
    --text-secondary: #4B5563;
    --text-muted: #9CA3AF;
    --dark: #0A0C10;
    --red: #EF4444;
    --yellow: #F59E0B;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 landscape; margin: 0; }
  html, body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 10px;
    line-height: 1.35;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    width: 297mm;
    height: 210mm;
    padding: 10mm 12mm;
    background: var(--bg);
    position: relative;
    overflow: hidden;
    page-break-after: always;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }
  .page-1 {
    background-image:
      radial-gradient(700px 350px at 90% -10%, rgba(8,248,135,.06), transparent 60%);
  }

  h1, h2, h3 { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 700; letter-spacing: -0.02em; line-height: 1.05; }

  /* Header (em ambas) */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-x {
    width: 28px;
    height: 28px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .brand-wordmark {
    height: 18px;
    width: auto;
    object-fit: contain;
  }
  .brand-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }
  /* Marca d'água com wordmark verde nas páginas */
  .watermark {
    position: absolute;
    bottom: 14mm;
    right: 12mm;
    width: 90px;
    opacity: 0.12;
    pointer-events: none;
  }
  .header-sub {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-muted);
    text-align: right;
    line-height: 1.3;
  }
  .header-sub strong { color: var(--text); display: block; font-size: 12px; letter-spacing: -0.01em; text-transform: none; margin-top: 1px; font-weight: 700; }
  .page-tag {
    display: inline-block;
    padding: 1px 6px;
    background: var(--bg-warm);
    border: 1px solid var(--border);
    border-radius: 3px;
    font-size: 8px;
    color: var(--text-muted);
    margin-right: 6px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }

  /* Manchete */
  .headline {
    background: var(--dark);
    color: #fff;
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 10px;
    background-image:
      radial-gradient(600px 250px at 90% 10%, rgba(8,248,135,.18), transparent 55%);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    flex-shrink: 0;
  }
  .headline .label {
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: rgba(255,255,255,.5);
    margin-bottom: 4px;
    font-weight: 600;
  }
  .headline .value {
    font-size: 24px;
    font-weight: 800;
    color: var(--green);
    letter-spacing: -0.02em;
    line-height: 1;
    margin-bottom: 4px;
  }
  .headline .value .of-goal {
    color: rgba(255,255,255,.45);
    font-size: 13px;
    font-weight: 500;
  }
  .headline .progress-track {
    background: rgba(255,255,255,.08);
    border-radius: 999px;
    height: 6px;
    width: 240px;
    overflow: hidden;
    margin-top: 6px;
  }
  .headline .progress-bar {
    background: var(--green);
    height: 100%;
    width: ${goalProgress}%;
    border-radius: 999px;
  }
  .headline .progress-meta {
    color: rgba(255,255,255,.55);
    font-size: 9px;
    margin-top: 4px;
  }
  .headline .right {
    text-align: right;
    border-left: 1px solid rgba(255,255,255,.12);
    padding-left: 18px;
    min-width: 140px;
  }
  .headline .right .pct {
    font-size: 22px;
    font-weight: 800;
    color: var(--green);
    line-height: 1;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .headline .right .pct-label {
    text-align: right;
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255,255,255,.55);
    margin-top: 4px;
    font-weight: 600;
    line-height: 1.3;
  }

  /* Pace row — meta diária */
  .pace-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }
  .pace-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .pace-card.pace-ok {
    background: var(--green-surface);
    border-color: rgba(8,248,135,.4);
  }
  .pace-card.pace-warn {
    background: rgba(245,158,11,.06);
    border-color: rgba(245,158,11,.3);
  }
  .pace-card .pace-label {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 5px;
  }
  .pace-card.pace-ok .pace-label { color: var(--green-dark); }
  .pace-card.pace-warn .pace-label { color: #B45309; }
  .pace-card .pace-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .pace-card .pace-sub {
    font-size: 9px;
    color: var(--text-secondary);
    line-height: 1.3;
  }

  /* Stat cards */
  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }
  .stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .stat .lbl {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 6px;
  }
  .stat .val {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
    letter-spacing: -0.02em;
    margin-bottom: 3px;
  }
  .stat .val.green { color: var(--green-dark); }
  .stat .sub {
    font-size: 9px;
    color: var(--text-secondary);
    line-height: 1.3;
  }

  /* Funnel */
  .funnel {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }
  .funnel-step {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 11px;
  }
  .funnel-step .step-name {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 4px;
  }
  .funnel-step .step-val {
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 3px;
    color: var(--text);
  }
  .funnel-step .step-pct {
    font-size: 8.5px;
    color: var(--text-secondary);
  }
  .funnel-step.warn { background: rgba(245,158,11,.06); border-color: rgba(245,158,11,.3); }
  .funnel-step.warn .step-val { color: var(--yellow); }
  .funnel-step.danger { background: rgba(239,68,68,.05); border-color: rgba(239,68,68,.3); }
  .funnel-step.danger .step-val { color: var(--red); }
  .funnel-step.green { background: var(--green-surface); border-color: rgba(8,248,135,.4); }
  .funnel-step.green .step-val { color: var(--green-dark); }

  /* Sparkline + Comparativo lado a lado */
  .row-2 {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 10px;
    margin-bottom: 10px;
    flex: 1;
    min-height: 0;
  }

  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .panel-head {
    padding: 8px 12px;
    background: var(--bg-warm);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .panel-head h3 {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text);
    font-weight: 700;
  }
  .panel-head .panel-meta {
    font-size: 8.5px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .panel-body {
    flex: 1;
    overflow: hidden;
  }

  /* Sparkline */
  .spark-container {
    padding: 12px 14px 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .spark-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    flex: 1;
    min-height: 60px;
    padding: 4px 0;
  }
  .spark-bar-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }
  .spark-bar {
    width: 100%;
    background: linear-gradient(180deg, var(--green) 0%, var(--green-dark) 100%);
    border-radius: 2px 2px 0 0;
    min-height: 2px;
  }
  .spark-day {
    font-size: 7px;
    color: var(--text-muted);
    margin-top: 3px;
  }
  .spark-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--border-soft);
    font-size: 8.5px;
  }
  .spark-meta .meta-item .k { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 7.5px; font-weight: 600; }
  .spark-meta .meta-item .v { color: var(--text); font-weight: 700; font-size: 11px; }

  /* Tabelas */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  th, td {
    padding: 5px 10px;
    text-align: left;
    border-bottom: 1px solid var(--border-soft);
  }
  th {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    font-weight: 600;
    background: var(--bg-warm);
  }
  tr:last-child td { border-bottom: none; }
  tfoot td {
    background: var(--bg-warm);
    font-weight: 700;
    border-top: 2px solid var(--border);
    border-bottom: none;
  }
  .empty { padding: 14px; text-align: center; color: var(--text-muted); font-size: 9px; }

  /* Footer */
  .footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--border);
    padding-top: 6px;
    margin-top: auto;
    font-size: 8px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    flex-shrink: 0;
  }

  /* Página 2 — section title (separa Pipeline EOM de Base Ativa) */
  .section-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-muted);
    font-weight: 700;
    margin: 0 0 6px;
    padding: 0 2px;
    flex-shrink: 0;
  }

  /* Página 2 — receita futura cards (4 cols) */
  .future-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }
  .future-stats.two-cols {
    grid-template-columns: repeat(2, 1fr);
    max-width: 60%;
  }
  .future-stat {
    background: var(--green-surface);
    border: 1px solid rgba(8,248,135,.4);
    border-radius: 8px;
    padding: 12px 14px;
  }
  .future-stat .lbl {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--green-dark);
    font-weight: 700;
    margin-bottom: 6px;
  }
  .future-stat .val {
    font-size: 22px;
    font-weight: 800;
    color: var(--text);
    line-height: 1;
    margin-bottom: 4px;
    letter-spacing: -0.02em;
  }
  .future-stat .sub {
    font-size: 9px;
    color: var(--text-secondary);
  }

  /* Página 2 — duas tabelas grandes lado a lado */
  .row-tables {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    flex: 1;
    margin-bottom: 10px;
    min-height: 0;
  }
  .row-tables .panel { height: 100%; }
  .row-tables .panel-body { overflow: hidden; }
</style>
</head>
<body>

<!-- ═══════════════════════ PÁGINA 1 — VISÃO EXECUTIVA ═══════════════════════ -->
<div class="page page-1">

  <div class="header">
    <div class="brand">
      <img class="brand-wordmark" src="${logos.wordmarkDataUrl}" alt="MUVX" />
      <div class="brand-name">· Briefing diário</div>
    </div>
    <div class="header-sub">
      <span class="page-tag">P. 1/2</span>${d.yesterdayLabel} fechado · MTD ${d.monthLabel}
      <strong>${d.todayLabel}</strong>
    </div>
  </div>

  <!-- Manchete -->
  <div class="headline">
    <div class="left">
      <div class="label">Receita MUVX líquida · MTD</div>
      <div class="value">${formatBRL(d.mtdRevenueMuvx)} <span class="of-goal">/ ${formatBRL(d.goal)}</span></div>
      <div class="progress-track"><div class="progress-bar"></div></div>
      <div class="progress-meta">${formatPct(d.goalProgressPercent)} da meta · ${formatBRL(Math.max(0, d.goal - d.mtdRevenueMuvx))} restantes em ${d.daysRemainingInMonth} dias</div>
    </div>
    <div class="right">
      ${d.goalIsAchieved
        ? `<div class="pct" style="color: var(--green);">META</div><div class="pct-label">batida</div>`
        : `<div class="pct">${formatBRL(d.dailyGoalRequired)}</div><div class="pct-label">por dia até fechar o mês</div>`}
    </div>
  </div>

  <!-- Pace card — comparação ritmo atual vs requerido -->
  <div class="pace-row">
    <div class="pace-card">
      <div class="pace-label">Ritmo atual (R$/dia)</div>
      <div class="pace-value">${formatBRL(d.dailyPaceCurrent)}</div>
      <div class="pace-sub">média ao longo de ${d.daysElapsedInMonth} ${d.daysElapsedInMonth === 1 ? 'dia' : 'dias'} fechados</div>
    </div>
    <div class="pace-card ${d.goalIsAchieved ? 'pace-ok' : (d.dailyPaceCurrent >= d.dailyGoalRequired ? 'pace-ok' : 'pace-warn')}">
      <div class="pace-label">Ritmo necessário daqui em diante</div>
      <div class="pace-value">${d.goalIsAchieved ? '—' : formatBRL(d.dailyGoalRequired)}</div>
      <div class="pace-sub">${d.goalIsAchieved ? 'meta já alcançada' : (d.dailyPaceCurrent >= d.dailyGoalRequired ? 'no ritmo · pode manter' : `precisa subir ${formatBRL(d.dailyGoalRequired - d.dailyPaceCurrent)}/dia`)}</div>
    </div>
    <div class="pace-card">
      <div class="pace-label">Projeção no ritmo atual</div>
      <div class="pace-value">${formatBRL(d.dailyPaceCurrent * (d.daysElapsedInMonth + d.daysRemainingInMonth))}</div>
      <div class="pace-sub">se manter o pace, fecha o mês em ${formatPct((d.dailyPaceCurrent * (d.daysElapsedInMonth + d.daysRemainingInMonth) / d.goal) * 100, 0)} da meta</div>
    </div>
  </div>

  <!-- 4 Stat cards -->
  <div class="stats">
    <div class="stat">
      <div class="lbl">Cadastros ${d.yesterdayLabel}</div>
      <div class="val">${d.newPersonalsD1}</div>
      <div class="sub">MTD ${d.newPersonalsMTD} · <span style="color:${deltaColor(d.newPersonalsDeltaPercent)};font-weight:600;">${formatDelta(d.newPersonalsDeltaPercent)}</span> vs ${d.lastMonthLabel}</div>
    </div>
    <div class="stat">
      <div class="lbl">Vendas ${d.yesterdayLabel}</div>
      <div class="val">${d.salesD1}</div>
      <div class="sub">MTD ${d.salesMTD} concluídas · ${formatBRL(d.gmvMTD)} GMV</div>
    </div>
    <div class="stat">
      <div class="lbl">GMV ${d.yesterdayLabel}</div>
      <div class="val">${formatBRL(d.gmvD1)}</div>
      <div class="sub">Receita líq. ontem ${formatBRL(d.revenueMuvxD1)}</div>
    </div>
    <div class="stat">
      <div class="lbl">Ticket médio MTD</div>
      <div class="val green">${formatBRL(d.avgTicketMTD)}</div>
      <div class="sub">GMV MTD ÷ ${d.salesMTD} vendas</div>
    </div>
  </div>

  <!-- Funil dos novos -->
  <div class="funnel">
    <div class="funnel-step">
      <div class="step-name">Novos cadastros · ${d.monthLabel}</div>
      <div class="step-val">${d.newPersonalsMTD}</div>
      <div class="step-pct">100% — base de ativação</div>
    </div>
    <div class="funnel-step ${d.percentWithProductMTD < 50 ? 'warn' : 'green'}">
      <div class="step-name">Criaram produto</div>
      <div class="step-val">${formatPct(d.percentWithProductMTD, 0)}</div>
      <div class="step-pct">${Math.round(d.newPersonalsMTD * d.percentWithProductMTD / 100)} de ${d.newPersonalsMTD}</div>
    </div>
    <div class="funnel-step ${d.percentWithStudentMTD < 20 ? 'danger' : 'warn'}">
      <div class="step-name">Convidaram aluno</div>
      <div class="step-val">${formatPct(d.percentWithStudentMTD, 0)}</div>
      <div class="step-pct">${Math.round(d.newPersonalsMTD * d.percentWithStudentMTD / 100)} de ${d.newPersonalsMTD}</div>
    </div>
    <div class="funnel-step ${d.newPersonalsPendingProduct.length > 5 ? 'danger' : 'warn'}">
      <div class="step-name">Travados sem produto</div>
      <div class="step-val">${d.newPersonalsPendingProduct.length}+</div>
      <div class="step-pct">Lista nominal na pág. 2 →</div>
    </div>
  </div>

  <!-- Sparkline + Comparativo -->
  <div class="row-2">
    <div class="panel">
      <div class="panel-head">
        <h3>Receita diária · ${d.monthLabel}</h3>
        <span class="panel-meta">GMV pago por dia · pico ${formatBRLShort(d.dailyMaxRevenue)}</span>
      </div>
      <div class="panel-body">
        <div class="spark-container">
          <div class="spark-bars">${sparkBarsHtml || '<div class="empty">Sem dados.</div>'}</div>
          <div class="spark-meta">
            <div class="meta-item"><div class="k">GMV MTD</div><div class="v">${formatBRL(d.gmvMTD)}</div></div>
            <div class="meta-item"><div class="k">Vendas MTD</div><div class="v">${d.salesMTD}</div></div>
            <div class="meta-item"><div class="k">Velocidade</div><div class="v">${(d.salesMTD / Math.max(1, d.dailySparkline.length)).toFixed(1)}/dia</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>${d.lastMonthLabel} vs ${d.monthLabel} · mesma janela MTD</h3>
        <span class="panel-meta">primeiros ${d.dailySparkline.length} dias</span>
      </div>
      <div class="panel-body">
        <table>
          <thead>
            <tr>
              <th>KPI</th>
              <th style="text-align:right;">${d.lastMonthLabel} (1–${d.dailySparkline.length})</th>
              <th style="text-align:right;">${d.monthLabel} (MTD)</th>
              <th style="text-align:right;">Δ</th>
            </tr>
          </thead>
          <tbody>${compRows}</tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Fonte: api.muvx.app · ${new Date(d.fetchedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
    <span>Página 1 de 2 · Visão executiva</span>
  </div>
  <img class="watermark" src="${logos.xGreenDataUrl}" alt="" />
</div>

<!-- ═══════════════════════ PÁGINA 2 — DETALHE OPERACIONAL ═══════════════════════ -->
<div class="page page-2">

  <div class="header">
    <div class="brand">
      <img class="brand-wordmark" src="${logos.wordmarkDataUrl}" alt="MUVX" />
      <div class="brand-name">· Briefing diário</div>
    </div>
    <div class="header-sub">
      <span class="page-tag">P. 2/2</span>Detalhe operacional
      <strong>${d.todayLabel}</strong>
    </div>
  </div>

  <!-- Pipeline até EOM -->
  <div class="section-title">Até fechar o mês · ${d.daysUntilEom} ${d.daysUntilEom === 1 ? 'dia' : 'dias'} restantes</div>
  <div class="future-stats">
    <div class="future-stat">
      <div class="lbl">Cobranças agendadas</div>
      <div class="val">${formatInt(d.untilEomScheduledCount)}</div>
      <div class="sub">${d.todayLabel} → fim do mês (status SCHEDULED)</div>
    </div>
    <div class="future-stat">
      <div class="lbl">GMV previsto · líquida MUVX</div>
      <div class="val">${formatBRL(d.untilEomScheduledRevenue)}</div>
      <div class="sub">≈ <strong>${formatBRL(d.untilEomMuvxRevenueProjected)}</strong> líquida (share médio ${formatPct(d.muvxShareObserved * 100, 1)})</div>
    </div>
    <div class="future-stat">
      <div class="lbl">Meta diária para bater R$ 10k</div>
      <div class="val">${d.goalIsAchieved ? '—' : formatBRL(d.dailyGoalRequired)}</div>
      <div class="sub">${d.goalIsAchieved ? 'meta já alcançada ✓' : `${formatBRL(Math.max(0, d.goal - d.mtdRevenueMuvx))} restantes / ${d.daysUntilEom} dias`}</div>
    </div>
    <div class="future-stat">
      <div class="lbl">Pace atual (média MTD)</div>
      <div class="val">${formatBRL(d.dailyPaceCurrent)}</div>
      <div class="sub">${d.daysElapsedInMonth} dias fechados · ${d.dailyPaceCurrent >= d.dailyGoalRequired ? 'no ritmo' : 'abaixo do ritmo'}</div>
    </div>
  </div>

  <!-- Base ativa -->
  <div class="section-title">Base ativa · estado atual</div>
  <div class="future-stats two-cols">
    <div class="future-stat">
      <div class="lbl">Assinaturas ATIVAS</div>
      <div class="val">${formatInt(d.activeSubscriptionsCount)}</div>
      <div class="sub">recorrências em andamento na base toda</div>
    </div>
    <div class="future-stat">
      <div class="lbl">MRR estimado</div>
      <div class="val">${formatBRL(d.mrrEstimated)}</div>
      <div class="sub">receita MUVX mensal projetada · base × ticket recorrente</div>
    </div>
  </div>

  <!-- 2 tabelas operacionais -->
  <div class="row-tables">
    <div class="panel">
      <div class="panel-head">
        <h3>Top 5 personais · receita MTD</h3>
        <span class="panel-meta">por bruto · ${d.monthLabel}</span>
      </div>
      <div class="panel-body">
        ${d.topPersonalsMTD.length ? `<table>
          <thead><tr><th>#</th><th>Personal</th><th style="text-align:right;">Vendas</th><th style="text-align:right;">Receita</th></tr></thead>
          <tbody>${topRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2">Total Top 5</td>
              <td style="text-align:right;">${d.topPersonalsMTD.reduce((s, p) => s + p.completedSales + p.scheduledSales, 0)}</td>
              <td style="text-align:right;">${formatBRL(d.topPersonalsMTD.reduce((s, p) => s + p.grossRevenue, 0))}</td>
            </tr>
          </tfoot>
        </table>` : `<div class="empty">Sem vendas no mês ainda.</div>`}
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Cadastros pendentes sem produto</h3>
        <span class="panel-meta">novos do mês · mais antigos primeiro · top 12</span>
      </div>
      <div class="panel-body">
        ${pendingRows ? `<table>
          <thead><tr><th>#</th><th>Personal</th><th>Cadastro</th></tr></thead>
          <tbody>${pendingRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2">Total listado</td>
              <td style="text-align:right;">${d.newPersonalsPendingProduct.length}</td>
            </tr>
          </tfoot>
        </table>` : `<div class="empty">Sem pendentes ✅ — todos os novos do mês já criaram produto.</div>`}
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Os números do PDF batem com o dashboard MUVX em tempo real</span>
    <span>Página 2 de 2 · Detalhe operacional</span>
  </div>
  <img class="watermark" src="${logos.xGreenDataUrl}" alt="" />
</div>

</body>
</html>`
}

export function buildSlackMessage(d: BriefingData): string {
  const deltaSign = d.newPersonalsDeltaPercent >= 0 ? '+' : '-'
  const remaining = d.goal - d.mtdRevenueMuvx
  const restantesTxt = remaining > 0 ? `${formatBRL(remaining)} restantes` : `meta batida`
  const absDelta = Math.abs(d.newPersonalsDeltaPercent).toFixed(1)
  const paceSign = d.dailyPaceCurrent >= d.dailyGoalRequired ? 'no ritmo' : 'abaixo do ritmo'

  // Linha de meta diária — varia se já bateu meta ou não
  const dailyLine = d.goalIsAchieved
    ? `*Meta batida.* Pace atual: ${formatBRL(d.dailyPaceCurrent)}/dia ao longo de ${d.daysElapsedInMonth} dias.`
    : `*Precisa fazer ${formatBRL(d.dailyGoalRequired)}/dia* nos próximos ${d.daysRemainingInMonth} dias para bater os ${formatBRL(d.goal)}. Pace atual: ${formatBRL(d.dailyPaceCurrent)}/dia (${paceSign}).`

  return [
    `*Briefing MUVX · ${d.todayLabel}*`,
    `_${d.yesterdayLabel} fechado + MTD (mês até ${d.yesterdayLabel})_`,
    ``,
    `*Receita MUVX MTD: ${formatBRL(d.mtdRevenueMuvx)} / ${formatBRL(d.goal)}* (${d.goalProgressPercent.toFixed(1)}%)`,
    `   ${restantesTxt}`,
    `   ${dailyLine}`,
    ``,
    `*ENTRADA*`,
    `• Novos personais ontem: ${d.newPersonalsD1} · MTD ${d.newPersonalsMTD} (${deltaSign}${absDelta}% vs ${d.lastMonthLabel} mesma janela, ${d.newPersonalsLastMonthSameDay})`,
    `• ${formatPct(d.percentWithProductMTD, 0)} dos novos do mês criaram produto · ${formatPct(d.percentWithStudentMTD, 0)} convidaram aluno`,
    ``,
    `*VENDAS*`,
    `• Ontem: ${d.salesD1} vendas · ${formatBRL(d.gmvD1)} GMV · ${formatBRL(d.revenueMuvxD1)} líquida`,
    `• MTD: ${d.salesMTD} vendas · ${formatBRL(d.gmvMTD)} GMV · ticket médio ${formatBRL(d.avgTicketMTD)}`,
    ``,
    `*ATÉ FECHAR O MÊS (${d.daysUntilEom} ${d.daysUntilEom === 1 ? 'dia' : 'dias'})*`,
    `• ${d.untilEomScheduledCount} cobranças agendadas · ${formatBRL(d.untilEomScheduledRevenue)} de GMV previsto`,
    `• Receita líquida MUVX projetada: ${formatBRL(d.untilEomMuvxRevenueProjected)} (share médio do mês ${formatPct(d.muvxShareObserved * 100, 1)})`,
    ``,
    `*BASE ATIVA*`,
    `• ${formatInt(d.activeSubscriptionsCount)} assinaturas ATIVAS · MRR estimado ${formatBRL(d.mrrEstimated)}`,
    ``,
    `PDF de 2 páginas anexo: visão executiva (sparkline + comparativo ${d.lastMonthLabel} vs ${d.monthLabel}) e detalhe operacional (top 5 + ${d.newPersonalsPendingProduct.length} cadastros sem produto).`,
  ].join('\n')
}
