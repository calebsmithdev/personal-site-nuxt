// Shared by Nitro and the static host's separately applied response headers.
// Report-only intentionally permits Nuxt's inline scripts/importmaps and styles.
const analyticsSources = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com'
].join(' ')

export const securityHeaders = {
  'Content-Security-Policy-Report-Only': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    // 'self' also covers Cloudflare's injected /cdn-cgi/ scripts.
    // Nuxt Content's client-side SQLite compiles WebAssembly, not JavaScript eval.
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${analyticsSources}`,
    "font-src 'self'",
    `connect-src 'self' ${analyticsSources}`,
    'frame-src https://www.youtube.com'
  ].join('; ') + ';',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
