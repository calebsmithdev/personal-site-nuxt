import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import GlobalHeader from '../../components/GlobalHeader.vue'

describe('GlobalHeader', () => {
  it('links the primary navigation to home and writing', async () => {
    const wrapper = await mountSuspended(GlobalHeader, {
      route: '/'
    })
    const linksByText = new Map(
      wrapper.findAll('a').map(link => [link.text(), link.attributes('href')])
    )

    expect(linksByText.get('Home')).toBe('/')
    expect(linksByText.get('Writing')).toBe('/blog')
  })
})
