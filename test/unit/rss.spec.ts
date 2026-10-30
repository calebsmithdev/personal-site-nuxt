import { describe, expect, it } from 'vitest'
import { absoluteFeedUrl, cdata, renderFeedHtml, rssDate, xmlText } from '../../server/utils/rss'

describe('RSS helpers', () => {
  it('formats date-only values at UTC midnight across timezone boundaries', () => {
    expect(rssDate('2024-03-10')).toBe('Sun, 10 Mar 2024 00:00:00 GMT')
    expect(rssDate('2024-11-03')).toBe('Sun, 03 Nov 2024 00:00:00 GMT')
  })
  it('resolves root, article-relative, fragment, and external URLs', () => {
    const base = 'https://caleb-smith.dev/blog/example'
    expect(absoluteFeedUrl('/blog/other', base)).toBe('https://caleb-smith.dev/blog/other')
    expect(absoluteFeedUrl('other', base)).toBe('https://caleb-smith.dev/blog/other')
    expect(absoluteFeedUrl('#heading', base)).toBe(`${base}#heading`)
    expect(absoluteFeedUrl('http://caleb-smith.dev/blog/other', base)).toBe('https://caleb-smith.dev/blog/other')
    expect(absoluteFeedUrl('http://example.com/image.png', base)).toBe('http://example.com/image.png')
  })
  it('escapes XML text and splits embedded CDATA terminators without losing content', () => {
    expect(xmlText('<A & "B">')).toBe('&lt;A &amp; &quot;B&quot;&gt;')
    expect(cdata('a]]>b]]>')).toBe('<![CDATA[a]]]]><![CDATA[>b]]]]><![CDATA[>]]>')
  })
  it('renders stored minimark, resolves images, and removes active elements and component wrappers', () => {
    const html = renderFeedHtml({ type: 'minimark', value: [
      ['p', {}, ['a', { href: '#test' }, 'Link'], ['img', { src: '/assets/img/test.png', alt: 'Test' }]],
      ['pre', { code: '<script>example</script>\n', language: 'html' }, 'ignored'],
      ['script', {}, 'bad()'], ['style', {}, 'bad{}'],
      ['custom-component', { ':value': 'state' }, ['p', {}, 'Text']],
      ['a', { href: 'javascript:alert(1)', onclick: 'bad()' }, 'Unsafe']
    ] }, 'https://caleb-smith.dev/blog/test', () => '/_nuxt/test.hash.png')
    expect(html).toContain('src="https://caleb-smith.dev/_nuxt/test.hash.png"')
    expect(html).toContain('href="https://caleb-smith.dev/blog/test#test"')
    expect(html).toContain('<pre><code class="language-html">&#x3C;script>example&#x3C;/script>\n</code></pre>')
    expect(html).toContain('<p>Text</p>')
    expect(html).not.toMatch(/<script|<style|custom-component|javascript:|onclick/)
  })
  it('keeps a code block filename ahead of its code', () => {
    const html = renderFeedHtml({ type: 'minimark', value: [
      ['pre', { code: 'export default {}\n', language: 'ts', filename: 'nuxt.config.ts' }, 'ignored'],
      ['a', { href: 'http://example.com/' }, 'External']
    ] }, 'https://caleb-smith.dev/blog/test', src => src)
    expect(html).toBe('<p><code>nuxt.config.ts</code></p><pre><code class="language-ts">export default {}\n</code></pre><a href="http://example.com/">External</a>')
  })
})
