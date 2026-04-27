import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Warm-up cron — roda 5min antes do briefing diário.
 *
 * Objetivo: forçar o Vercel a manter a função Lambda "quente" (com bundle de Chromium
 * já carregado) para que o briefing das 08:30 não pague cold start (~30-40s extras).
 *
 * O que faz:
 *  1. Importa puppeteer-core + @sparticuz/chromium dinamicamente (mesmo bundle do briefing)
 *  2. Inicializa um browser headless e fecha imediatamente
 *  3. Vercel mantém a função quente por ~5 min após execução
 *
 * Quando 5min depois o /api/cron/briefing-diario disparar, ele reusa o mesmo container.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const startedAt = Date.now()
  let chromiumReady = false
  let browserLaunched = false

  try {
    // Em dev local, não tem Chromium serverless — só responde ok
    const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME
    if (!isVercel) {
      return NextResponse.json({ ok: true, env: 'local', skipped: true })
    }

    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')
    chromiumReady = true

    const browser = await puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
    browserLaunched = true
    await browser.close()

    return NextResponse.json({
      ok: true,
      warmedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      chromiumReady,
      browserLaunched,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - startedAt,
      chromiumReady,
      browserLaunched,
    }, { status: 500 })
  }
}
