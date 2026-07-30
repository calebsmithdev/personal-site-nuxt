import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TableOfContents from '../../components/post/TableOfContents.vue'

describe('TableOfContents', () => {
  afterEach(() => {
    document.querySelectorAll('[data-characterization-heading]').forEach(element => element.remove())
    vi.unstubAllGlobals()
  })

  it('renders and observes nested headings in document order', async () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    let observerOptions: IntersectionObserverInit | undefined
    let observerCallback: IntersectionObserverCallback | undefined
    let observerInstance: IntersectionObserver | undefined
    let observerCount = 0

    class FakeIntersectionObserver {
      constructor (callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerCallback = callback
        observerOptions = options
        observerInstance = this as unknown as IntersectionObserver
        observerCount += 1
      }

      observe = observe
      disconnect = disconnect
      unobserve = vi.fn()
      takeRecords = () => []
    }

    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)

    for (const [id, tag] of [
      ['first-heading', 'h2'],
      ['first-child', 'h3'],
      ['second-heading', 'h2'],
      ['second-child', 'h3']
    ] as const) {
      const heading = document.createElement(tag)
      heading.id = id
      heading.dataset.characterizationHeading = ''
      document.body.append(heading)
    }

    const wrapper = await mountSuspended(TableOfContents, {
      props: {
        links: [
          {
            id: 'first-heading',
            depth: 2,
            text: 'First heading',
            children: [
              { id: 'first-child', depth: 3, text: 'First nested heading' }
            ]
          },
          {
            id: 'second-heading',
            depth: 2,
            text: 'Second heading',
            children: [
              { id: 'second-child', depth: 3, text: 'Second nested heading' }
            ]
          }
        ]
      }
    })

    const links = wrapper.findAll('a')

    expect(links.map(link => link.text())).toEqual([
      'First heading',
      'First nested heading',
      'Second heading',
      'Second nested heading'
    ])
    expect(new Set(links.map(link => link.attributes('href'))).size).toBe(4)
    expect(wrapper.find('a[href="#first-child"]').classes()).toContain('toc-link-depth-3')
    expect(wrapper.find('a[href="#second-child"]').classes()).toContain('toc-link-depth-3')
    expect(observerCount).toBe(1)
    expect(observe).toHaveBeenCalledTimes(4)
    expect(observe.mock.calls.map(([heading]) => heading.id)).toEqual([
      'first-heading',
      'first-child',
      'second-heading',
      'second-child'
    ])
    expect(observerOptions).toEqual({
      rootMargin: '-12% 0px -72% 0px',
      threshold: 0
    })
    expect(wrapper.findAll('[aria-current="location"]')).toHaveLength(1)
    expect(wrapper.find('a[href="#first-heading"]').attributes('aria-current')).toBe('location')

    const nestedHeading = document.getElementById('second-child')
    if (!observerCallback || !observerInstance || !nestedHeading) {
      throw new Error('Expected the nested heading and observer to be initialized')
    }
    const headingBounds = nestedHeading.getBoundingClientRect()
    observerCallback?.([
      {
        time: 0,
        isIntersecting: true,
        intersectionRatio: 1,
        target: nestedHeading,
        boundingClientRect: headingBounds,
        intersectionRect: headingBounds,
        rootBounds: null
      }
    ], observerInstance)
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[aria-current="location"]')).toHaveLength(1)
    expect(wrapper.find('a[href="#first-heading"]').attributes('aria-current')).toBeUndefined()
    expect(wrapper.find('a[href="#second-child"]').attributes('aria-current')).toBe('location')

    wrapper.unmount()

    expect(disconnect).toHaveBeenCalledOnce()
  })
})
