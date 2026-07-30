import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBlog } from '../../composables/useBlog'

const mocks = vi.hoisted(() => {
  const find = vi.fn()
  const builder = {
    where: vi.fn(),
    without: vi.fn(),
    sort: vi.fn(),
    find
  }

  builder.where.mockReturnValue(builder)
  builder.without.mockReturnValue(builder)
  builder.sort.mockReturnValue(builder)

  return {
    builder,
    find,
    queryContent: vi.fn(() => builder)
  }
})

mockNuxtImport('queryContent', () => mocks.queryContent)

describe('useBlog', () => {
  beforeEach(() => {
    clearNuxtState('articles')
    vi.clearAllMocks()
    mocks.find.mockReset()
  })

  it('stores ordered articles while excluding the blog index', async () => {
    const newest = { _path: '/blog/newest', title: 'Newest' }
    const blogIndex = { _path: '/blog', title: 'Blog' }
    const older = { _path: '/blog/older', title: 'Older' }
    mocks.find.mockResolvedValue([newest, blogIndex, older])

    const { articles, fetchList } = useBlog()

    await expect(fetchList()).resolves.toBeUndefined()

    expect(articles.value).toEqual([newest, older])
    expect(mocks.queryContent).toHaveBeenCalledWith('blog')
    expect(mocks.builder.where).toHaveBeenCalledWith({ _extension: 'md' })
    expect(mocks.builder.without).toHaveBeenCalledWith(['body', 'excerpt'])
    expect(mocks.builder.sort).toHaveBeenCalledWith({ date: -1 })
  })

  it('stores an empty successful result', async () => {
    mocks.find.mockResolvedValue([])
    const { articles, fetchList } = useBlog()

    await expect(fetchList()).resolves.toBeUndefined()

    expect(articles.value).toEqual([])
  })

  it('rejects with the query error without changing state', async () => {
    const error = new Error('content query failed')
    mocks.find.mockRejectedValue(error)
    const { articles, fetchList } = useBlog()
    const stateAtQueryStart = articles.value

    await expect(fetchList()).rejects.toBe(error)

    expect(articles.value).toBe(stateAtQueryStart)
  })

  it('uses a non-empty cached list without querying again', async () => {
    const cached = { _path: '/blog/cached', title: 'Cached' }
    mocks.find.mockResolvedValue([cached])
    const { articles, fetchList } = useBlog()

    await fetchList()
    await fetchList()

    expect(articles.value).toEqual([cached])
    expect(mocks.queryContent).toHaveBeenCalledTimes(1)
    expect(mocks.find).toHaveBeenCalledTimes(1)
  })
})
