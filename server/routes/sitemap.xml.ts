import axios from 'axios'
import { xml2json } from 'xml-js'

let nuxtBaseUrl = ''
let wpBaseUrl = ''

const getXmlTextValue = (object, ignoreReplace = false) => {
  if (!object?._text) {
    return null
  }

  if (!ignoreReplace) {
    return object?._text.replace(wpBaseUrl, nuxtBaseUrl)
  }

  return object?._text
}

const getYoastSitemapLinks = async (url: string) => {
  try {
    const { data } = await axios.get(url)
    const sitemapXml = xml2json(data, { compact: true, spaces: 4, ignoreComment: true })
    const sitemapJson = JSON.parse(sitemapXml)
    const sitemapLinks = sitemapJson.sitemapindex?.sitemap ?? []
    const urlsetLinks = sitemapJson.urlset?.url ?? []

    let siteUrls = []
    for await (const linkObject of sitemapLinks) {
      const loc = getXmlTextValue(linkObject.loc, true)
      const newLinks = await getYoastSitemapLinks(loc)
      siteUrls = [...new Set([...siteUrls, ...newLinks])]
    }

    for await (const linkObject of urlsetLinks) {
      siteUrls.push(linkObject)
    }

    return siteUrls
  } catch (err) {
    return []
  }
}

const generateXml = (urls) => {
  const nonEmptyUrlObjects = urls.filter(value => Object.keys(value).length !== 0)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${nonEmptyUrlObjects
        .map((url) => {
          const loc = `<loc>${getXmlTextValue(url.loc)}</loc>`
          let lastmod = ''
          let changefreq = ''
          let priority = ''

          const urlLastMod = getXmlTextValue(url.lastmod)
          const urlChangefreq = getXmlTextValue(url.changefreq)
          const urlPriority = getXmlTextValue(url.priority)

          if (urlLastMod) {
            lastmod = `<lastmod>${urlLastMod}</lastmod>`
          }
          if (urlChangefreq) {
            changefreq = `<changefreq>${urlChangefreq}</changefreq>`
          }
          if (urlPriority) {
            priority = `<priority>${urlPriority}</priority>`
          }
          return `<url>
              ${loc}
              ${lastmod}
              ${changefreq}
              ${priority}
          </url>`
        })
        .join('')}
    </urlset>`

  return xml
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  nuxtBaseUrl = config.public.wordpressBaseUrl.split(':')[0] + '://'
  nuxtBaseUrl += event.req.headers.host
  wpBaseUrl = config.public.wordpressBaseUrl

  const urls = await getYoastSitemapLinks(config.public.wordpressBaseUrl + '/sitemap_index.xml')
  event.res.setHeader('content-type', 'application/xml')
  event.res.end(generateXml(urls))
})
