import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { displayCategory as appDisplayCategory } from '../../app/utils/article'
import { displayCategory, parsePostFrontmatter, validatePostPath } from '../../scripts/social-image/frontmatter'
import { socialImageOutputPath } from '../generated/social-image-path'

const post = (title: string, categories = '[Nuxt]') => `---\ntitle: ${title}\ncategories: ${categories}\n---\n`

describe('social image output paths', () => {
  it.each([
    ['cover%231.png', 'cover#1.png'],
    ['cover%3F1.png', 'cover?1.png'],
    ['cover%251.png', 'cover%1.png'],
    ['cover%2523.png', 'cover%23.png']
  ])('decodes %s exactly once as a filesystem path', (encoded, literal) => {
    expect(socialImageOutputPath(`/social/blog/${encoded}`, new URL('file:///tmp/output/')))
      .toBe(`/tmp/output/social/blog/${literal}`)
  })
})

describe('social card frontmatter', () => {
  it.each([
    ["'Developer''s tools'", "Developer's tools"],
    ['Plain title', 'Plain title'],
    ['Hello, world', 'Hello, world'],
    [String.raw`"A \"quote\", \\ path\nnext\t\u00e9"`, 'A "quote", \\ path\nnext\té']
  ])('parses scalar %s', (input, expected) => {
    expect(parsePostFrontmatter(post(input)).title).toBe(expected)
  })

  it('tokenizes mixed flow scalars and quoted commas', () => {
    expect(parsePostFrontmatter(post('Title', `[plain, 'Developer''s tools', "a, b", "Nu\\u0078t"]`)).categories)
      .toEqual(['plain', "Developer's tools", 'a, b', 'Nuxt'])
  })

  it.each([
    post('Title', '\n  - Nuxt'),
    post('|\n  multiline'),
    post('>\n  folded'),
    post('plain\n  continuation'),
    post('"multi\nline"'),
    post('&title Title'),
    post('*title'),
    post('!!str Title'),
    post('Title', '[&category Nuxt]'),
    post('Title', '[!!str Nuxt]'),
    post('Title', '[[Nuxt]]'),
    post('Title', '[]'),
    post('Title', '[Nuxt,'),
    post('"unterminated'),
    post(String.raw`"bad\q"`),
    post(String.raw`"bad\u12zz"`)
  ])('rejects unsupported frontmatter %s', (source) => {
    expect(() => parsePostFrontmatter(source, 'example.md')).toThrow('example.md: use a single-line scalar title')
  })
})

describe('article filename convention', () => {
  it.each(['Nuxt/Routing.md', 'café.md', '1.post.md', 'index.md', 'nuxt/index.md'])('rejects %s', (file) => {
    expect(() => { validatePostPath(file) }).toThrow(file)
  })

  it('accepts nested lowercase slugs', () => {
    expect(() => { validatePostPath('nuxt/routing-2.md') }).not.toThrow()
  })

  it('validates every current article and matches the app category display', () => {
    const directory = new URL('../../content/blog/', import.meta.url)
    const files = readdirSync(directory, { recursive: true, encoding: 'utf8' }).filter(file => file.endsWith('.md'))
    expect(files.length).toBeGreaterThan(0)
    const categories = new Set(['Javascript'])
    for (const file of files) {
      expect(() => { validatePostPath(file) }).not.toThrow()
      for (const category of parsePostFrontmatter(readFileSync(new URL(file, directory), 'utf8'), file).categories) {
        categories.add(category)
      }
    }
    for (const category of categories) {
      expect(displayCategory(category), category).toBe(appDisplayCategory(category))
    }
  })
})
