/**
 * Renderiza HTML em PDF.
 *
 * - Em produção (Vercel/AWS Lambda): usa @sparticuz/chromium + puppeteer-core (chromium serverless).
 * - Em dev local (Mac): tenta usar puppeteer-core apontando para o Chrome instalado.
 *   Se não houver Chrome local, falha clara — basta setar PUPPETEER_EXECUTABLE_PATH.
 */

const LOCAL_CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
]

async function getLaunchOptions() {
  const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

  if (isVercel) {
    const chromium = (await import('@sparticuz/chromium')).default
    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }
  }

  // Dev local
  const fs = await import('fs')
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH
  let executablePath = envPath
  if (!executablePath) {
    for (const c of LOCAL_CHROME_CANDIDATES) {
      if (fs.existsSync(c)) { executablePath = c; break }
    }
  }
  if (!executablePath) {
    throw new Error('Chrome não encontrado para render local. Setar PUPPETEER_EXECUTABLE_PATH.')
  }
  return {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
    executablePath,
    headless: true,
  }
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const puppeteer = await import('puppeteer-core')
  const launchOptions = await getLaunchOptions()
  const browser = await puppeteer.default.launch(launchOptions)
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
