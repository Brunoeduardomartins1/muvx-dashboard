import { NextRequest, NextResponse } from 'next/server'
import type { MetricsResponse } from '@/lib/types'
import { fetchNewPersonalsWithActivation } from '@/lib/briefing/fetchActivation'
import { computeBriefingData } from '@/lib/briefing/computeData'
import { buildBriefingHtml, buildSlackMessage } from '@/lib/briefing/buildHtml'
import { renderHtmlToPdf } from '@/lib/briefing/renderPdf'
import { postBriefingToSlack, postPlainMessage } from '@/lib/briefing/postToSlack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GOAL_DEFAULT = 10_000

function pad2(n: number): string { return n < 10 ? `0${n}` : `${n}` }
function isoDate(d: Date): string { return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}` }

/**
 * Datas de referência para o briefing.
 * - "yesterday" (D-1): dia fechado
 * - "monthStart": primeiro dia do mês corrente
 * - "lastMonthSameDay": mesmo dia do mês anterior (ex: hoje 28 → mês anterior 27)
 *   * janela usada para comparativo MTD: do dia 1 do mês anterior até esse mesmo dia anterior (D-1 do mês anterior)
 *
 * Trabalhamos em America/Sao_Paulo. Em Vercel, o servidor roda em UTC, então deslocamos -3h para
 * ancorar a "data de hoje BRT" e a partir dela derivar D-1.
 */
function computeWindows(now: Date) {
  // BRT = UTC-3
  const brtOffsetMs = 3 * 60 * 60 * 1000
  const brtNow = new Date(now.getTime() - brtOffsetMs)

  const yesterday = new Date(brtNow)
  yesterday.setUTCDate(brtNow.getUTCDate() - 1)
  const today = new Date(brtNow)

  const yesterdayISO = isoDate(yesterday)
  const todayISO = isoDate(today)

  const monthStart = new Date(Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth(), 1))
  const monthStartISO = isoDate(monthStart)

  // Mês anterior: pegar mesmo "dia ontem" no mês anterior
  const lastMonthStart = new Date(Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth() - 1, 1))
  const lastMonthSameDay = new Date(Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth() - 1, yesterday.getUTCDate()))
  const lastMonthStartISO = isoDate(lastMonthStart)
  const lastMonthSameDayISO = isoDate(lastMonthSameDay)

  // Até o fim do mês corrente (hoje → último dia do mês, inclusive)
  // Date.UTC(year, month+1, 0) = dia 0 do mês seguinte = último dia do mês atual
  const monthEnd = new Date(Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth() + 1, 0))
  const monthEndISO = isoDate(monthEnd)

  return {
    todayISO, yesterdayISO,
    monthStartISO, monthEndISO,
    lastMonthStartISO, lastMonthSameDayISO,
  }
}

async function fetchMetrics(origin: string, sessionSecret: string, from: string, to: string): Promise<MetricsResponse> {
  const url = `${origin}/api/metrics?from=${from}&to=${to}`
  const res = await fetch(url, {
    headers: { Cookie: `dash_session=${sessionSecret}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`fetch metrics ${url} → ${res.status} ${await res.text().catch(() => '')}`)
  }
  return await res.json()
}

function getOrigin(req: NextRequest): string {
  // Em produção, usar VERCEL_URL ou PUBLIC_BASE_URL. Em dev, derivar do host.
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  const host = req.headers.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const sessionSecret = process.env.DASHBOARD_SECRET
  if (!sessionSecret) {
    return NextResponse.json({ message: 'DASHBOARD_SECRET não configurado' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get('dryRun') === '1'
  const skipPdf = searchParams.get('skipPdf') === '1'
  const returnPdf = searchParams.get('returnPdf') === '1'  // download PDF direto, sem Slack

  const origin = getOrigin(req)
  const goal = Number(process.env.NEXT_PUBLIC_MUVX_GOAL ?? GOAL_DEFAULT)
  const slackChannel = process.env.SLACK_BRIEFING_CHANNEL
  const slackToken = process.env.SLACK_USER_TOKEN

  const w = computeWindows(new Date())

  try {
    // 4 fetches do /api/metrics em paralelo + 1 fetch dos novos do mês com activation
    const [d1Metrics, mtdMetrics, lastMonthSameDayMetrics, untilEomMetrics, newPersonalsMonth] = await Promise.all([
      fetchMetrics(origin, sessionSecret, w.yesterdayISO, w.yesterdayISO),
      fetchMetrics(origin, sessionSecret, w.monthStartISO, w.yesterdayISO),
      fetchMetrics(origin, sessionSecret, w.lastMonthStartISO, w.lastMonthSameDayISO),
      fetchMetrics(origin, sessionSecret, w.todayISO, w.monthEndISO).catch(() => null),
      fetchNewPersonalsWithActivation(`${w.monthStartISO}T00:00:00.000Z`, `${w.yesterdayISO}T23:59:59.999Z`),
    ])

    const data = computeBriefingData({
      d1Metrics, mtdMetrics, lastMonthSameDayMetrics, untilEomMetrics,
      newPersonalsMonth,
      goal,
      yesterdayISO: w.yesterdayISO,
      todayISO: w.todayISO,
    })

    const messageText = buildSlackMessage(data)
    const html = buildBriefingHtml(data)

    let pdfBuffer: Buffer | null = null
    if (!skipPdf) {
      pdfBuffer = await renderHtmlToPdf(html)
    }

    const pdfFilename = `briefing-muvx-${w.todayISO}.pdf`

    if (returnPdf && pdfBuffer) {
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${pdfFilename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        windows: w,
        messageText,
        pdfSizeBytes: pdfBuffer?.length ?? null,
        slackPosted: false,
      })
    }

    if (!slackToken || !slackChannel) {
      return NextResponse.json({
        ok: false,
        error: 'SLACK_USER_TOKEN ou SLACK_BRIEFING_CHANNEL não configurados',
        messageText,
        pdfSizeBytes: pdfBuffer?.length ?? null,
      }, { status: 503 })
    }

    if (!pdfBuffer) {
      const ok = await postPlainMessage(messageText, slackChannel, slackToken)
      return NextResponse.json({ ok, slackPosted: ok, mode: 'text-only' })
    }

    const slackResult = await postBriefingToSlack({
      text: messageText,
      pdfBuffer,
      pdfFilename,
      channel: slackChannel,
      userToken: slackToken,
    })

    if (!slackResult.ok) {
      return NextResponse.json({
        ok: false,
        slackPosted: false,
        error: slackResult.error,
      }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      slackPosted: true,
      fileId: slackResult.fileId,
      pdfSizeBytes: pdfBuffer.length,
      windows: w,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Tenta avisar no Slack que falhou
    if (slackToken && slackChannel) {
      await postPlainMessage(`⚠️ Briefing MUVX falhou hoje: ${msg}`, slackChannel, slackToken)
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
