import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'dash_session'
const SECRET = process.env.DASHBOARD_SECRET ?? ''

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Sempre libera: login page e login API
  if (pathname === '/login' || pathname === '/api/auth/login') {
    return NextResponse.next()
  }

  // Cron jobs autenticam via header Authorization: Bearer ${CRON_SECRET}
  // (Vercel envia esse header automaticamente conforme vercel.json)
  if (pathname.startsWith('/api/cron/')) {
    const cronSecret = process.env.CRON_SECRET
    const auth = req.headers.get('authorization') ?? ''
    console.log('[mw] cron path:', pathname, 'secretPresent:', !!cronSecret, 'secretLen:', cronSecret?.length ?? 0, 'authPresent:', !!auth, 'authLen:', auth.length)
    if (cronSecret && auth === `Bearer ${cronSecret}`) {
      return NextResponse.next()
    }
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  // Verifica cookie de sessão
  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (session && SECRET && session === SECRET) {
    return NextResponse.next()
  }

  // Redireciona para login (API routes retornam 401)
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
