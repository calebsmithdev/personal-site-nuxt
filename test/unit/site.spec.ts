import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { articleSocialImage, defaultSocialImage, isSocialImageSource } from '../../app/utils/site'

const readPngSize = (path: string) => {
  const file = readFileSync(new URL(path, import.meta.url))

  expect(file.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))
  expect(file.toString('ascii', 12, 16)).toBe('IHDR')

  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20), bytes: file.length }
}

describe('default social image', () => {
  it('ships a PNG in public/ that matches the declared dimensions', () => {
    expect(defaultSocialImage.src).toBe('/social/default.png')
    expect(defaultSocialImage.type).toBe('image/png')

    const size = readPngSize(`../../public${defaultSocialImage.src}`)
    expect(size.width).toBe(defaultSocialImage.width)
    expect(size.height).toBe(defaultSocialImage.height)
    expect(size.width).toBe(1200)
    expect(size.height).toBe(630)
    // Keep the card well under the 5 MB limit most social platforms enforce.
    expect(size.bytes).toBeLessThan(1024 * 1024)
  })

  it('describes the artwork in its alt text', () => {
    expect(defaultSocialImage.alt).toContain('Caleb Smith')
    expect(defaultSocialImage.alt).toContain('caleb-smith.dev')
  })
})

describe('isSocialImageSource', () => {
  it.each([
    '/social/article.png',
    '/assets/img/blog/cover.png',
    'https://images.example.test/cover.jpg'
  ])('accepts %s', (src) => {
    expect(isSocialImageSource(src)).toBe(true)
  })

  it.each([
    'social/article.png',
    '//images.example.test/cover.jpg',
    'http://images.example.test/cover.jpg',
    'data:image/png;base64,AAAA',
    'https://',
    'https://[bad]/cover.png',
    ''
  ])('rejects %s', (src) => {
    expect(isSocialImageSource(src)).toBe(false)
  })
})

describe('articleSocialImage', () => {
  it('falls back to the default when the article has no image', () => {
    expect(articleSocialImage({ title: 'Article' })).toBeUndefined()
  })

  it('uses the image alt text, or the article title without one', () => {
    expect(articleSocialImage({ title: 'Article', image: '/social/a.png', imageAlt: 'A cluster diagram' }))
      .toEqual({ src: '/social/a.png', alt: 'A cluster diagram' })
    expect(articleSocialImage({ title: 'Article', image: '/social/a.png' }))
      .toEqual({ src: '/social/a.png', alt: 'Article' })
  })

  it('does not claim dimensions for an override', () => {
    const image = articleSocialImage({ title: 'Article', image: 'https://images.example.test/cover.jpg' })

    expect(image).not.toHaveProperty('width')
    expect(image).not.toHaveProperty('height')
    expect(image).not.toHaveProperty('type')
  })

  it('resolves asset pipeline paths to their built URL', () => {
    const image = articleSocialImage(
      { title: 'Article', image: '/assets/img/blog/cover.png' },
      src => src.replace('/assets/img/blog/cover.png', '/_nuxt/cover.abc123.png')
    )

    expect(image?.src).toBe('/_nuxt/cover.abc123.png')
  })

  it('falls back to the default for a malformed image URL', () => {
    expect(articleSocialImage({ title: 'Article', image: 'https://[bad]/cover.png' })).toBeUndefined()
  })

  it('falls back to the default when an asset resolves to an inline data URI', () => {
    const image = articleSocialImage(
      { title: 'Article', image: '/assets/img/blog/tiny.png' },
      () => 'data:image/png;base64,AAAA'
    )

    expect(image).toBeUndefined()
  })
})
