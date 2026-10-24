import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  libraryLoaded: vi.fn(),
  createGtag: vi.fn(() => ({ install: vi.fn() }))
}))

describe('optional analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.doMock('vue-gtag', () => {
      mocks.libraryLoaded()
      return { createGtag: mocks.createGtag }
    })
    useRuntimeConfig().public.googleAnalyticsId = ''
  })

  it('does not load or install analytics without configuration', async () => {
    const { default: analyticsPlugin } = await import('../../app/plugins/google-analytics.client')
    analyticsPlugin(useNuxtApp())

    expect(mocks.libraryLoaded).not.toHaveBeenCalled()
    expect(mocks.createGtag).not.toHaveBeenCalled()
  })

  it('installs configured analytics with the existing router tracking options', async () => {
    useRuntimeConfig().public.googleAnalyticsId = 'test-analytics-id'
    const nuxtApp = useNuxtApp()
    const install = vi.spyOn(nuxtApp.vueApp, 'use')

    const { default: analyticsPlugin } = await import('../../app/plugins/google-analytics.client')
    expect(analyticsPlugin(nuxtApp)).toBeUndefined()

    await vi.waitFor(() => {
      expect(install).toHaveBeenCalledWith(mocks.createGtag.mock.results[0]?.value)
    })
    expect(mocks.libraryLoaded).toHaveBeenCalledOnce()
    expect(mocks.createGtag).toHaveBeenCalledWith({
      tagId: 'test-analytics-id',
      appName: 'Caleb Smith',
      pageTracker: {
        router: nuxtApp.$router,
        useScreenview: true
      }
    })
    install.mockRestore()
  })
})
