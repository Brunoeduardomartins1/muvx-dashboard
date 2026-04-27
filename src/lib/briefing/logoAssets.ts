import fs from 'fs'
import path from 'path'

/**
 * Carrega os logos do diretório `public/` como Data URLs base64.
 *
 * Por que base64 e não URL pública: o PDF é renderizado pelo Puppeteer chamando setContent
 * com o HTML embutido — não há contexto de URL base. Embutir como data:image evita 100% das
 * armadilhas de fetch externo no serverless.
 *
 * Cache em módulo: lê do disco uma vez por cold start e mantém em memória.
 */

interface LogoAssets {
  xGreenDataUrl: string   // Símbolo X verde (1920x1920)
  wordmarkDataUrl: string // Wordmark MUVX preto (1920x673)
}

let cached: LogoAssets | null = null

function fileToDataUrl(filePath: string, mime = 'image/png'): string {
  const buf = fs.readFileSync(filePath)
  return `data:${mime};base64,${buf.toString('base64')}`
}

export function getLogoAssets(): LogoAssets {
  if (cached) return cached
  const publicDir = path.join(process.cwd(), 'public')
  cached = {
    xGreenDataUrl: fileToDataUrl(path.join(publicDir, 'muvx-x-green.png')),
    // Atenção: nomenclatura dos arquivos está invertida. logo-light.png é o ESCURO (preto),
    // que é o que precisamos para fundo claro do briefing.
    wordmarkDataUrl: fileToDataUrl(path.join(publicDir, 'logo-light.png')),
  }
  return cached
}
