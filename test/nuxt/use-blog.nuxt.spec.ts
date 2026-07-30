import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBlog } from '../../app/composables/useBlog'

const mocks = vi.hoisted(() => {
  const all = vi.fn()
  const builder = {
    select: vi.fn(),
    order: vi.fn(),
    all
  }

  builder.select.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)

  return {
    builder,
    all,
    queryCollection: vi.fn(() => builder)
  }
})

mockNuxtImport('queryCollection', () => mocks.queryCollection)

describe('useBlog', () => {
  beforeEach(() => {
    clearNuxtState('articles')
    vi.clearAllMocks()
    mocks.all.mockReset()
  })

  it('stores the ordered article summaries', async () => {
    const newest = { path: '/blog/newest', title: 'Newest' }
    const older = { path: '/blog/older', title: 'Older' }
    mocks.all.mockResolvedValue([newest, older])

    const { articles, fetchList } = useBlog()

    await expect(fetchList()).resolves.toBeUndefined()

    expect(articles.value).toEqual([newest, older])
    expect(mocks.queryCollection).toHaveBeenCalledWith('blog')
    expect(mocks.builder.select).toHaveBeenCalledWith(
      'id',
      'path',
      'title',
      'description',
      'date',
      'categories'
    )
    expect(mocks.builder.order).toHaveBeenCalledWith('date', 'DESC')
  })

  it('stores an empty successful result', async () => {
    mocks.all.mockResolvedValue([])
    const { articles, fetchList } = useBlog()

    await expect(fetchList()).resolves.toBeUndefined()

    expect(articles.value).toEqual([])
  })

  it('rejects with the query error without changing state', async () => {
    const error = new Error('content query failed')
    mocks.all.mockRejectedValue(error)
    const { articles, fetchList } = useBlog()
    const stateAtQueryStart = articles.value

    await expect(fetchList()).rejects.toBe(error)

    expect(articles.value).toBe(stateAtQueryStart)
  })

  it('uses a non-empty cached list without querying again', async () => {
    const cached = { path: '/blog/cached', title: 'Cached' }
    mocks.all.mockResolvedValue([cached])
    const { articles, fetchList } = useBlog()

    await fetchList()
    await fetchList()

    expect(articles.value).toEqual([cached])
    expect(mocks.queryCollection).toHaveBeenCalledTimes(1)
    expect(mocks.all).toHaveBeenCalledTimes(1)
  })
})
