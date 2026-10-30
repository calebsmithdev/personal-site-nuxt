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
    await analyticsPlugin(useNuxtApp())
    await vi.dynamicImportSettled()

    expect(mocks.libraryLoaded).not.toHaveBeenCalled()
    expect(mocks.createGtag).not.toHaveBeenCalled()
  })

  it('records page views for the initial page and client navigation when configured', async () => {
    vi.doUnmock('vue-gtag')
    useRuntimeConfig().public.googleAnalyticsId = 'G-TEST12345'
    const nuxtApp = useNuxtApp()
    const router = nuxtApp.$router
    const initialPath = router.currentRoute.value.fullPath
    const previousGtag = Object.getOwnPropertyDescriptor(nuxtApp.vueApp.config.globalProperties, '$gtag')
    await router.push('/')
    await router.isReady()

    const dataLayer: IArguments[] = []
    vi.stubGlobal('dataLayer', dataLayer)
    vi.stubGlobal('gtag', undefined)
    const afterEach = vi.spyOn(router, 'afterEach')
    // Run the real tracker, but never append its remote script to the document.
    const analyticsScripts: HTMLScriptElement[] = []
    const appendToHead = document.head.appendChild.bind(document.head)
    const appendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLScriptElement && node.src.startsWith('https://www.googletagmanager.com/')) {
        analyticsScripts.push(node)
        return node
      }
      return appendToHead(node)
    })

    try {
      const { default: analyticsPlugin } = await import('../../app/plugins/google-analytics.client')
      expect(analyticsPlugin(nuxtApp)).toBeUndefined()

      const events = () => dataLayer.map(args => Array.from(args)).filter(args => args[0] === 'event')
      await vi.waitFor(() => {
        expect(events()).toEqual([
          ['event', 'page_view', expect.objectContaining({ page_path: '/' })]
        ])
      })

      const articlePath = '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
      await router.push('/blog')
      await router.push(articlePath)

      expect(events()).toEqual([
        ['event', 'page_view', expect.objectContaining({ page_path: '/' })],
        ['event', 'page_view', expect.objectContaining({ page_path: '/blog' })],
        ['event', 'page_view', expect.objectContaining({ page_path: articlePath })]
      ])
      expect(dataLayer.map(args => Array.from(args))).toContainEqual([
        'config', 'G-TEST12345', expect.objectContaining({ send_page_view: false })
      ])
      expect(analyticsScripts).toHaveLength(1)
      expect(analyticsScripts[0]).toHaveProperty(
        'src', 'https://www.googletagmanager.com/gtag/js?id=G-TEST12345&l=dataLayer'
      )
    }
    finally {
      for (const result of afterEach.mock.results) {
        if (result.type === 'return') result.value()
      }
      afterEach.mockRestore()
      appendChild.mockRestore()
      vi.unstubAllGlobals()
      if (previousGtag) {
        Object.defineProperty(nuxtApp.vueApp.config.globalProperties, '$gtag', previousGtag)
      }
      else {
        Reflect.deleteProperty(nuxtApp.vueApp.config.globalProperties, '$gtag')
      }
      useRuntimeConfig().public.googleAnalyticsId = ''
      await router.push(initialPath)
    }
  })
})
