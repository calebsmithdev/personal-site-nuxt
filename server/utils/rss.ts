import { toHast } from 'minimark/hast'
import { toHtml } from 'hast-util-to-html'
import type { Root, ElementContent, Element } from 'hast'
import type { MinimarkTree } from 'minimark'

export const rssDate = (date: string): string => new Date(`${date}T00:00:00.000Z`).toUTCString()
export const xmlText = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
export const cdata = (value: string): string => `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`

export const absoluteFeedUrl = (value: string, base: string): string => {
  const url = new URL(value, base)
  if (url.protocol === 'http:' && url.host === new URL(base).host) { url.protocol = 'https:' }
  return url.href
}

// Only ordinary article HTML survives. Vue/MDC components unwrap to their text.
const htmlTags = new Set('a p div span h1 h2 h3 h4 h5 h6 ul ol li blockquote strong em b i del s hr br img pre code table thead tbody tr th td figure figcaption details summary sup sub kbd mark iframe'.split(' '))
type ContentHast = ReturnType<typeof toHast>['children'][number]

export const renderFeedHtml = (
  body: MinimarkTree,
  articleUrl: string,
  resolveAsset: (src: string) => string
): string => {
  const convert = (node: ContentHast): ElementContent[] => {
    if (node.type === 'text') { return [{ type: 'text', value: node.value || '' }] }
    const tag = node.tag || ''
    if (['script', 'style'].includes(tag)) { return [] }
    const children = (node.children || []).flatMap(convert)
    if (!htmlTags.has(tag)) { return children }
    if (tag === 'pre' && typeof node.props?.code === 'string') {
      const language = typeof node.props.language === 'string' ? node.props.language : undefined
      const filename = typeof node.props.filename === 'string' ? node.props.filename : undefined
      const pre: Element = { type: 'element', tagName: 'pre', properties: {}, children: [
        { type: 'element', tagName: 'code', properties: language ? { className: [`language-${language}`] } : {}, children: [{ type: 'text', value: node.props.code }] }
      ] }
      // The page shows the filename in a toolbar; prose like "add this to the file" relies on it.
      return filename
        ? [{ type: 'element', tagName: 'p', properties: {}, children: [
            { type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: filename }] }
          ] }, pre]
        : [pre]
    }
    const properties: Element['properties'] = {}
    for (const key of ['id', 'title', 'alt', 'width', 'height', 'colspan', 'rowspan', 'start', 'className', 'class', 'href', 'src']) {
      const value = node.props?.[key]
      if (typeof value !== 'string' && typeof value !== 'number') { continue }
      if (key === 'href' || key === 'src') {
        const resolved = key === 'src' ? resolveAsset(String(value)) : String(value)
        const url = absoluteFeedUrl(resolved, articleUrl)
        if (!/^(https?:|mailto:|tel:)/.test(url)) { continue }
        properties[key] = url
      } else {
        properties[key] = value
      }
    }
    return [{ type: 'element', tagName: tag, properties, children }]
  }
  const tree: Root = { type: 'root', children: toHast(body).children.flatMap(convert) }
  return toHtml(tree)
}
