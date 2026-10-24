import { beforeEach, describe, expect, it, vi } from 'vitest'
import analyticsPlugin from '../../app/plugins/google-analytics'

const mocks = vi.hoisted(() => ({
  libraryLoaded: vi.fn(),
  createGtag: vi.fn(() => ({ install: vi.fn() }))
}))

vi.mock('vue-gtag', () => {
  mocks.libraryLoaded()
  return { createGtag: mocks.createGtag }
})

describe('optional analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRuntimeConfig().public.googleAnalyticsId = ''
  })

  it('does not load or install analytics without configuration', async () => {
    await analyticsPlugin(useNuxtApp())

    expect(mocks.libraryLoaded).not.toHaveBeenCalled()
    expect(mocks.createGtag).not.toHaveBeenCalled()
  })

  it('installs configured analytics with the existing router tracking options', async () => {
    useRuntimeConfig().public.googleAnalyticsId = 'test-analytics-id'
    const nuxtApp = useNuxtApp()
    const install = vi.spyOn(nuxtApp.vueApp, 'use')

    await analyticsPlugin(nuxtApp)

    expect(mocks.libraryLoaded).toHaveBeenCalledOnce()
    expect(mocks.createGtag).toHaveBeenCalledWith({
      tagId: 'test-analytics-id',
      appName: 'Caleb Smith',
      pageTracker: {
        router: nuxtApp.$router,
        useScreenview: true
      }
    })
    expect(install).toHaveBeenCalledWith(mocks.createGtag.mock.results[0]?.value)
    install.mockRestore()
  })
})
