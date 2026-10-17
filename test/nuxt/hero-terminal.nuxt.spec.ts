import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import HeroTerminal from '../../app/components/HeroTerminal.vue'
import type { BlogArticleSummary } from '../../app/types'

const article = (slug: string, title: string, date: string): BlogArticleSummary => ({
  id: `blog/${slug}.md`,
  path: `/blog/${slug}`,
  title,
  description: `${title} description`,
  date,
  categories: ['WordPress']
})

const articles = [
  article('newest-note', 'Newest note', '2025-04-16'),
  article('second-note', 'Second note', '2024-05-12'),
  article('third-note', 'Third note', '2024-01-19'),
  article('fourth-note', 'Fourth note', '2023-12-27')
]
const originalTimezone = process.env.TZ

describe('HeroTerminal', () => {
  afterEach(() => {
    process.env.TZ = originalTimezone
  })

  it('lists the three newest field notes as dated links', async () => {
    const wrapper = await mountSuspended(HeroTerminal, {
      props: { articles }
    })
    const notes = wrapper.findAll('.notes li')

    expect(notes).toHaveLength(3)
    expect(notes.map(note => note.find('time').attributes('datetime'))).toEqual([
      '2025-04-16',
      '2024-05-12',
      '2024-01-19'
    ])
    expect(notes.map(note => note.find('a').text())).toEqual([
      'newest-note',
      'second-note',
      'third-note'
    ])
    expect(notes.map(note => note.find('a').attributes('href'))).toEqual([
      '/blog/newest-note',
      '/blog/second-note',
      '/blog/third-note'
    ])
    expect(notes.map(note => note.find('a').attributes('aria-label'))).toEqual([
      'Newest note',
      'Second note',
      'Third note'
    ])
    expect(wrapper.text()).toContain('head -3')
  })

  it('keeps Content dates on the same calendar day east of UTC', async () => {
    process.env.TZ = 'Asia/Tokyo'

    const wrapper = await mountSuspended(HeroTerminal, {
      props: { articles }
    })

    expect(wrapper.find('.notes time').attributes('datetime')).toBe('2025-04-16')
    expect(wrapper.find('.notes time').text()).toBe('2025-04-16')
  })

  it('omits the field note listing when there are no articles', async () => {
    const wrapper = await mountSuspended(HeroTerminal, {
      props: { articles: [] }
    })

    expect(wrapper.find('.notes').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('field-notes/')
    expect(wrapper.text()).toContain('whoami')
  })

  it('disables the typing animation for reduced motion', async () => {
    const component = await readFile(resolve(process.cwd(), 'app/components/HeroTerminal.vue'), 'utf8')
    const reducedMotion = component.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/)?.[1]

    expect(reducedMotion).toMatch(/\.line,\s*\.typed,\s*\.caret\s*\{\s*animation: none;/)
  })

  it('reveals the field note links as soon as one receives keyboard focus', async () => {
    const component = await readFile(resolve(process.cwd(), 'app/components/HeroTerminal.vue'), 'utf8')

    expect(component).toMatch(/\.notes:focus-within\s*\{\s*animation: none;/)
  })

  it('renders on the homepage in place of a raster hero image', async () => {
    const homepage = await readFile(resolve(process.cwd(), 'app/pages/index.vue'), 'utf8')

    expect(homepage).toContain('<HeroTerminal :articles="articles" />')
    expect(homepage).not.toContain('<picture>')
  })
})
