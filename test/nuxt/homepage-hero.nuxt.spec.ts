import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const sourcePath = resolve(root, 'app/assets/img/homepage-homelab-v1.png')
const outputDirectory = resolve(root, 'public/images/homepage-homelab')
const widths = [640, 1024, 1536] as const
const formats = ['avif', 'webp', 'jpg'] as const
const sharpFormats = {
  avif: 'heif',
  webp: 'webp',
  jpg: 'jpeg'
} as const

describe('homepage hero assets', () => {
  it('generates derivatives from the Nuxt 4 app asset', async () => {
    const generator = await readFile(resolve(root, 'scripts/generate-homepage-hero.mjs'), 'utf8')

    expect(generator).toContain(
      "new URL('../app/assets/img/homepage-homelab-v1.png', import.meta.url)"
    )
    expect(generator).not.toContain(
      "new URL('../assets/img/homepage-homelab-v1.png', import.meta.url)"
    )
  })

  it('provides all requested local formats, dimensions, and aspect ratios', async () => {
    for (const width of widths) {
      for (const format of formats) {
        const metadata = await sharp(resolve(outputDirectory, `hero-${width}.${format}`)).metadata()

        expect(metadata.format).toBe(sharpFormats[format])
        expect(metadata.width).toBe(width)
        expect(metadata.height).toBe(Math.round(width * 2 / 3))
        expect(metadata.width! / metadata.height!).toBeCloseTo(3 / 2, 2)
      }
    }
  })

  it('keeps every derivative smaller than the canonical source', async () => {
    const sourceSize = (await stat(sourcePath)).size

    for (const width of widths) {
      for (const format of formats) {
        const outputSize = (await stat(resolve(outputDirectory, `hero-${width}.${format}`))).size

        expect(outputSize).toBeLessThan(sourceSize)
      }
    }
  })
})
