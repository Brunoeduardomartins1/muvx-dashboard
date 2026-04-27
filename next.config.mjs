/** @type {import('next').NextConfig} */
const nextConfig = {
  // @sparticuz/chromium e puppeteer-core devem ser tratados como pacotes externos
  // pelo Next.js no servidor, senão o bundler tenta bundlar o binário do Chromium
  // (que não existe em /vercel/path0/node_modules/@sparticuz/chromium/bin após bundle).
  // Sem isto, o cron quebra com "input directory does not exist" em runtime.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  experimental: {
    // Compatibilidade com Next 14 (serverExternalPackages é estável só em Next 15)
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
};

export default nextConfig;
