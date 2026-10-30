import { faJsSquare, faSwift, faWordpressSimple } from '@fortawesome/free-brands-svg-icons'
import { faCube, faDharmachakra } from '@fortawesome/free-solid-svg-icons'
import { afterEach, describe, expect, it } from 'vitest'
import {
  articleDateTime,
  articleUpdatedDate,
  categoryIcon,
  displayCategory,
  countWords,
  formatArticleDate,
  getArticlePosition,
  getHomepageArticles,
  getReadingMinutes
} from '../../app/utils/article'

describe('article helpers', () => {
  describe('countWords', () => {
    it('counts undefined and empty content as zero words', () => {
      expect(countWords(undefined)).toBe(0)
      expect(countWords([])).toBe(0)
      expect(countWords({ children: [] })).toBe(0)
    })

    it('ignores whitespace-only text', () => {
      expect(countWords({ type: 'text', value: ' \n\t ' })).toBe(0)
    })

    it('recursively counts nested text nodes', () => {
      expect(countWords({
        children: [
          { type: 'text', value: 'one two' },
          {
            children: [
              { type: 'text', value: 'three' },
              { type: 'text', value: 'four five' }
            ]
          }
        ]
      })).toBe(5)
    })

    it('excludes preformatted subtrees', () => {
      expect(countWords({
        children: [
          { type: 'text', value: 'count this' },
          {
            tag: 'pre',
            children: [
              { type: 'text', value: 'do not count this code' }
            ]
          },
          { type: 'text', value: 'and this' }
        ]
      })).toBe(4)
    })

    it('counts Content 3 minimark trees while excluding preformatted tuples', () => {
      expect(countWords({
        type: 'minimark',
        value: [
          ['p', {}, 'one two'],
          ['div', {}, ['span', {}, 'three']],
          ['pre', {}, ['code', {}, 'do not count this code']],
          'four'
        ]
      })).toBe(4)
    })
  })

  describe('getReadingMinutes', () => {
    const words = (count: number) => ({
      type: 'text',
      value: Array.from({ length: count }, () => 'word').join(' ')
    })

    it('returns at least one minute', () => {
      expect(getReadingMinutes(words(1))).toBe(1)
    })

    it('rounds 220 words to one minute', () => {
      expect(getReadingMinutes(words(220))).toBe(1)
    })

    it('rounds 221 words up to two minutes', () => {
      expect(getReadingMinutes(words(221))).toBe(2)
    })
  })

  describe('getArticlePosition', () => {
    const articles = [
      { path: '/blog/newest', title: 'Newest' },
      { path: '/blog/middle', title: 'Middle' },
      { path: '/blog/oldest', title: 'Oldest' }
    ]

    it('positions the first article with only an older neighbor', () => {
      expect(getArticlePosition(articles, '/blog/newest')).toEqual({
        index: 0,
        displayNumber: '01',
        newer: null,
        older: articles[1]
      })
    })

    it('positions a middle article between newer and older neighbors', () => {
      expect(getArticlePosition(articles, '/blog/middle')).toEqual({
        index: 1,
        displayNumber: '02',
        newer: articles[0],
        older: articles[2]
      })
    })

    it('positions the last article with only a newer neighbor', () => {
      expect(getArticlePosition(articles, '/blog/oldest')).toEqual({
        index: 2,
        displayNumber: '03',
        newer: articles[1],
        older: null
      })
    })

    it('preserves the missing article display fallback', () => {
      expect(getArticlePosition(articles, '/blog/missing')).toEqual({
        index: -1,
        displayNumber: '01',
        newer: null,
        older: null
      })
    })
  })

  describe('getHomepageArticles', () => {
    const articles = ['01', '02', '03', '04', '05', '06'].map(number => ({ path: `/blog/${number}` }))

    it('features the newest article and lists the next four', () => {
      expect(getHomepageArticles(articles)).toEqual({
        featured: articles[0],
        recent: articles.slice(1, 5)
      })
    })

    it('returns every remaining article when there are fewer than four', () => {
      expect(getHomepageArticles(articles.slice(0, 3))).toEqual({
        featured: articles[0],
        recent: articles.slice(1, 3)
      })
    })

    it('handles an empty article list', () => {
      expect(getHomepageArticles([])).toEqual({
        featured: undefined,
        recent: []
      })
    })
  })

  describe('article dates', () => {
    const originalTimezone = process.env.TZ

    afterEach(() => {
      process.env.TZ = originalTimezone
    })

    it.each(['UTC', 'America/Chicago', 'Asia/Tokyo', 'Pacific/Kiritimati'])(
      'keeps a Content date on the same calendar day in %s',
      (timezone) => {
        process.env.TZ = timezone

        expect(formatArticleDate('2025-04-16')).toBe('April 16, 2025')
        expect(articleDateTime('2025-04-16')).toBe('2025-04-16')
        expect(articleUpdatedDate('2025-04-16', '2025-04-17')).toBe('2025-04-17')
        expect(formatArticleDate(articleUpdatedDate('2025-04-16', '2025-04-17')!)).toBe('April 17, 2025')
        expect(articleUpdatedDate('2025-04-16', '2025-04-16')).toBeUndefined()
        expect(articleUpdatedDate('2025-04-16', '2025-04-15')).toBeUndefined()
        expect(articleUpdatedDate(new Date('2025-04-16T00:00:00Z'), new Date('2025-04-17T00:00:00Z'))).toBe('2025-04-17')
      }
    )

    it('shows no updated date for unparseable or missing dates', () => {
      expect(articleUpdatedDate('2025-04-16', 'not-a-date')).toBeUndefined()
      expect(articleUpdatedDate('not-a-date', '2025-04-17')).toBeUndefined()
      expect(articleUpdatedDate('2025-04-16', undefined as unknown as string)).toBeUndefined()
    })

    it('formats Date values by their UTC calendar day', () => {
      process.env.TZ = 'Asia/Tokyo'
      const date = new Date('2023-12-27T00:00:00.000Z')

      expect(formatArticleDate(date)).toBe('December 27, 2023')
      expect(articleDateTime(date)).toBe('2023-12-27')
    })
  })
})

describe('article categories', () => {
  it('formats the legacy Javascript label while preserving other category names', () => {
    expect(displayCategory('Javascript')).toBe('JavaScript')
    expect(displayCategory('SwiftUI')).toBe('SwiftUI')
    expect(displayCategory('New category')).toBe('New category')
  })

  it.each([
    ['Advanced Custom Fields (ACF)', faWordpressSimple],
    ['Javascript', faJsSquare],
    ['Kubernetes', faDharmachakra],
    ['Proxmox', faCube],
    ['SwiftUI', faSwift],
    ['WordPress', faWordpressSimple],
    ['New category', faCube]
  ])('keeps the existing icon for %s', (category, icon) => {
    expect(categoryIcon(category)).toBe(icon)
  })
})
