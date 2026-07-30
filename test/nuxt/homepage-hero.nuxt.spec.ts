import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const sourcePath = resolve(root, 'assets/img/homepage-homelab-v1.png')
const outputDirectory = resolve(root, 'public/images/homepage-homelab')
const widths = [640, 1024, 1536] as const
const formats = ['avif', 'webp', 'jpg'] as const
const sharpFormats = {
  avif: 'heif',
  webp: 'webp',
  jpg: 'jpeg'
} as const
const alt =
  'An illustrated homelab workspace with a server rack, laptop, network storage, and connected infrastructure symbols'

describe('homepage hero assets', () => {
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

  it('declares a responsive, eager, high-priority picture contract', async () => {
    const homepage = await readFile(resolve(root, 'pages/index.vue'), 'utf8')
    const picture = homepage.match(/<picture>[\s\S]*?<\/picture>/)?.[0]

    expect(picture).toBeDefined()
    expect(picture).toContain('type="image/avif"')
    expect(picture).toContain('type="image/webp"')
    expect(picture).toContain(
      'srcset="/images/homepage-homelab/hero-640.avif 640w, /images/homepage-homelab/hero-1024.avif 1024w, /images/homepage-homelab/hero-1536.avif 1536w"'
    )
    expect(picture).toContain(
      'srcset="/images/homepage-homelab/hero-640.webp 640w, /images/homepage-homelab/hero-1024.webp 1024w, /images/homepage-homelab/hero-1536.webp 1536w"'
    )
    expect(picture).toContain('src="/images/homepage-homelab/hero-1536.jpg"')
    expect(picture).toContain(
      'srcset="/images/homepage-homelab/hero-640.jpg 640w, /images/homepage-homelab/hero-1024.jpg 1024w, /images/homepage-homelab/hero-1536.jpg 1536w"'
    )
    expect(picture?.match(/sizes="\(max-width: 1023px\) 100vw, 48vw"/g)).toHaveLength(3)
    expect(picture).toContain(`alt="${alt}"`)
    expect(picture).toContain('width="1536"')
    expect(picture).toContain('height="1024"')
    expect(picture).toContain('fetchpriority="high"')
    expect(picture).toContain('decoding="async"')
    expect(picture).not.toContain('loading="lazy"')
  })
})
