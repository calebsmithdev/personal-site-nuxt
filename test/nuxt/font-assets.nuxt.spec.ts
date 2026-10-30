import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const projectFile = (path: string) => resolve(process.cwd(), path)

describe('font asset configuration', () => {
  it('uses production Fontsource packages instead of the Google Fonts module', async () => {
    const packageJson = JSON.parse(
      await readFile(projectFile('package.json'), 'utf8')
    ) as PackageManifest

    expect(packageJson.dependencies).toHaveProperty('@fontsource/lora')
    expect(packageJson.dependencies).toHaveProperty('@fontsource/poppins')
    expect(packageJson.dependencies).toHaveProperty('@fontsource/ibm-plex-mono')
    expect(packageJson.devDependencies).not.toHaveProperty('@nuxtjs/google-fonts')
  })

  it('loads the required local weights before the typography styles', async () => {
    const config = await readFile(projectFile('nuxt.config.ts'), 'utf8')
    const cssSection = config.match(/css:\s*\[([\s\S]*?)\]/)

    expect(cssSection).not.toBeNull()

    const cssEntries = [...(cssSection?.[1] ?? '').matchAll(/['"]([^'"]+)['"]/g)]
      .map(match => match[1])

    expect(cssEntries).toEqual([
      '@fontsource/lora/500.css',
      '@fontsource/poppins/500.css',
      '@fontsource/poppins/700.css',
      '@fontsource/ibm-plex-mono/400.css',
      '@fontsource/ibm-plex-mono/500.css',
      '@/assets/css/reset.css',
      '@/assets/css/typography.css'
    ])
  })

  it('keeps the typography variables mapped to Poppins, Lora, and IBM Plex Mono', async () => {
    const typography = await readFile(projectFile('app/assets/css/typography.css'), 'utf8')

    expect(typography).toMatch(/--font-heading:\s*'Poppins'/)
    expect(typography).toMatch(/--font-serif:\s*'Lora'/)
    expect(typography).toMatch(/--font-mono:\s*'IBM Plex Mono'/)
  })
})
