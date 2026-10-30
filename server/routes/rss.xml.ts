import { queryCollection } from '@nuxt/content/server'
import { getSiteConfig } from '#site-config/server'
import manifest from 'nuxt/internal/manifest'
import { defaultDescription } from '../../app/utils/site'
import { absoluteFeedUrl, cdata, renderFeedHtml, rssDate, xmlText } from '../utils/rss'

export default defineEventHandler(async (event) => {
  const origin = new URL(getSiteConfig(event).url!).origin
  const posts = await queryCollection(event, 'blog').order('date', 'DESC').order('path', 'ASC').all()
  const resolveAsset = (src: string): string => {
    if (!src.startsWith('/assets/')) { return src }
    // Vite keys are relative to Nuxt's app directory; file is relative to /_nuxt/.
    const asset = manifest[src.slice(1)]
    if (!asset) { throw new Error(`RSS asset missing from client manifest: ${src}`) }
    return `/_nuxt/${asset.file}`
  }
  const items = posts.map((post) => {
    const url = absoluteFeedUrl(post.path.replace(/\/$/, ''), origin)
    const html = renderFeedHtml(post.body, url, resolveAsset)
    return `  <item>
    <title>${xmlText(post.title)}</title>
    <link>${xmlText(url)}</link>
    <guid isPermaLink="true">${xmlText(url)}</guid>
    <pubDate>${rssDate(post.date)}</pubDate>
    <description>${xmlText(post.description)}</description>
${post.categories.map(category => `    <category>${xmlText(category)}</category>`).join('\n')}
    <content:encoded>${cdata(html)}</content:encoded>
  </item>`
  })
  setResponseHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Caleb Smith</title>
  <link>${origin}/</link>
  <description>${xmlText(defaultDescription)}</description>
  <language>en-us</language>
  <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
${posts[0] ? `  <lastBuildDate>${rssDate(posts[0].date)}</lastBuildDate>\n` : ''}${items.join('\n')}
</channel>
</rss>
`
})
