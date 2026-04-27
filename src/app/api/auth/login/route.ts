import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'dash_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

// Rate limiting em memória (por IP)
// Vercel functions são stateless — isso resiste dentro de uma instância quente
const attempts = new Map<string, { count: number; blockedUntil: number }>()
const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutos

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const now = Date.now()

  // Verifica bloqueio por IP
  const state = attempts.get(ip)
  if (state && state.blockedUntil > now) {
    const remaining = Math.ceil((state.blockedUntil - now) / 60000)
    return NextResponse.json(
      { message: `Muitas tentativas. Tente novamente em ${remaining} min.` },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { password } = body

  const expected = process.env.DASHBOARD_PASSWORD
  const secret   = process.env.DASHBOARD_SECRET

  if (!expected || !secret) {
    return NextResponse.json({ message: 'Servidor mal configurado' }, { status: 500 })
  }

  if (!password || password !== expected) {
    // Registra tentativa falha
    const current = attempts.get(ip) ?? { count: 0, blockedUntil: 0 }
    current.count++
    if (current.count >= MAX_ATTEMPTS) {
      current.blockedUntil = now + BLOCK_DURATION
    }
    attempts.set(ip, current)

    // Delay fixo para dificultar timing attacks
    await new Promise(r => setTimeout(r, 800))

    const remaining = MAX_ATTEMPTS - current.count
    const msg = remaining > 0
      ? `Senha incorreta. ${remaining} tentativa(s) restante(s).`
      : `Muitas tentativas. Bloqueado por 15 min.`
    return NextResponse.json({ message: msg }, { status: 401 })
  }

  // Sucesso — limpa contador do IP
  attempts.delete(ip)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
  })
  return res
}
