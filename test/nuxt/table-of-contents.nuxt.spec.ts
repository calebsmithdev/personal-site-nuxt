import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TableOfContents from '../../components/post/TableOfContents.vue'

describe('TableOfContents', () => {
  afterEach(() => {
    document.querySelectorAll('[data-characterization-heading]').forEach(element => element.remove())
    vi.unstubAllGlobals()
  })

  it('observes and renders only top-level headings', async () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    let observerOptions: IntersectionObserverInit | undefined

    class FakeIntersectionObserver {
      constructor (_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerOptions = options
      }

      observe = observe
      disconnect = disconnect
      unobserve = vi.fn()
      takeRecords = () => []
    }

    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)

    for (const id of ['first-heading', 'first-child', 'second-heading', 'second-child']) {
      const heading = document.createElement('h2')
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

    expect(links.map(link => link.text())).toEqual(['First heading', 'Second heading'])
    expect(wrapper.text()).not.toContain('First nested heading')
    expect(wrapper.text()).not.toContain('Second nested heading')
    expect(observe).toHaveBeenCalledTimes(2)
    expect(observe.mock.calls.map(([heading]) => heading.id)).toEqual([
      'first-heading',
      'second-heading'
    ])
    expect(observerOptions).toEqual({
      rootMargin: '-12% 0px -72% 0px',
      threshold: 0
    })

    await links[1].trigger('click')

    expect(links[0].attributes('aria-current')).toBeUndefined()
    expect(links[1].attributes('aria-current')).toBe('location')

    wrapper.unmount()

    expect(disconnect).toHaveBeenCalledOnce()
  })
})
