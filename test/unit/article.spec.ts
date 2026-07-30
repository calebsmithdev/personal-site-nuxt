import { describe, expect, it } from 'vitest'
import {
  countWords,
  getArticlePosition,
  getReadingMinutes
} from '../../utils/article'

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
      { _path: '/blog/newest', title: 'Newest' },
      { _path: '/blog/middle', title: 'Middle' },
      { _path: '/blog/oldest', title: 'Oldest' }
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
})
