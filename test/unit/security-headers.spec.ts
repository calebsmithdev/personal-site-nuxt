import { describe, expect, it } from 'vitest'
import { securityHeaders } from '../../config/security-headers'

const directives = Object.fromEntries(
  securityHeaders['Content-Security-Policy-Report-Only'].split(';').filter(value => value.trim()).map((value) => {
    const [name, ...sources] = value.trim().split(/\s+/)
    return [name, sources]
  })
)

describe('security header policy', () => {
  it('starts in report-only mode without extending HSTS or inventing a report endpoint', () => {
    expect(securityHeaders).not.toHaveProperty('Content-Security-Policy')
    expect(securityHeaders).not.toHaveProperty('Strict-Transport-Security')
    expect(directives).not.toHaveProperty('report-uri')
    expect(directives).not.toHaveProperty('report-to')
    expect(directives['default-src']).toEqual(["'self'"])
    expect(directives['base-uri']).toEqual(["'self'"])
    expect(directives['object-src']).toEqual(["'none'"])
    expect(directives['frame-ancestors']).toEqual(["'none'"])
  })

  it('permits Nuxt inline scripts/importmaps/styles, same-origin Cloudflare scripts and the YouTube embed', () => {
    expect(directives['script-src']).toEqual([
      "'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", 'https://static.cloudflareinsights.com'
    ])
    expect(directives['style-src']).toEqual(["'self'", "'unsafe-inline'"])
    expect(directives['frame-src']).toEqual(['https://www.youtube.com'])
    expect(directives['font-src']).toEqual(["'self'"])
    expect(directives['img-src']).toContain('data:')
  })

  it('allows only the manual beacon connection origin and no analytics image origins', () => {
    expect(directives['connect-src']).toEqual(["'self'", 'https://cloudflareinsights.com'])
    expect(directives['img-src']).toEqual(["'self'", 'data:'])
  })

  it('disables camera, microphone and geolocation without disabling video playback features', () => {
    expect(securityHeaders['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()')
  })
})
