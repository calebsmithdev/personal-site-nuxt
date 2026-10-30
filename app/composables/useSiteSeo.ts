import { defaultSocialImage, type SocialImage } from '../utils/site'

export type SiteSeoOptions = {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
  image?: SocialImage
} & ({
  type: 'article'
  datePublished: string
  dateModified: string
} | {
  type?: 'website'
  datePublished?: never
  dateModified?: never
})

interface SiteSeoMetaInput extends NonNullable<Parameters<typeof useSeoMeta>[0]> {
  twitterDomain: string
  twitterUrl: string
}

const normalizePath = (path: string) => {
  const pathWithoutLeadingSlashes = path.replace(/^\/+/, '')
  return pathWithoutLeadingSlashes ? `/${pathWithoutLeadingSlashes}` : '/'
}

export const useSiteSeo = ({
  title,
  description,
  path,
  type = 'website',
  absoluteTitle = false,
  image = defaultSocialImage,
  datePublished,
  dateModified
}: SiteSeoOptions) => {
  const origin = useSiteConfig().url.replace(/\/+$/, '')
  const url = `${origin}${normalizePath(path)}`
  const imageUrl = new URL(image.src, `${origin}/`).href
  const ogImage = {
    url: imageUrl,
    ...(imageUrl.startsWith('https://') && { secureUrl: imageUrl }),
    ...(image.type && { type: image.type }),
    ...(image.width && image.height && { width: image.width, height: image.height }),
    alt: image.alt
  }
  const seoMeta: SiteSeoMetaInput = {
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: type,
    ogLocale: 'en_US',
    ogUrl: url,
    ogImage,
    /* eslint-disable @typescript-eslint/no-deprecated -- X/Twitter still reads twitter:* tags. */
    twitterCard: 'summary_large_image',
    twitterCreator: '@CalebSmithDev',
    twitterSite: '@CalebSmithDev',
    twitterDomain: new URL(origin).hostname,
    twitterTitle: title,
    twitterDescription: description,
    twitterUrl: url,
    twitterImage: { url: imageUrl, alt: image.alt }
    /* eslint-enable @typescript-eslint/no-deprecated */
  }

  useSeoMeta(seoMeta)

  const person = {
    '@type': 'Person',
    '@id': `${origin}/#person`,
    name: 'Caleb Smith',
    url: `${origin}/`,
    jobTitle: 'Full-Stack Developer',
    description: 'Full-stack developer in Kansas building web apps with Vue, Nuxt, TypeScript and Laravel, and the infrastructure that runs them.',
    homeLocation: {
      '@type': 'Place',
      name: 'Kansas, United States',
      address: { '@type': 'PostalAddress', addressRegion: 'KS', addressCountry: 'US' }
    },
    knowsAbout: ['Vue.js', 'Nuxt', 'TypeScript', 'Laravel', 'PHP', 'Kubernetes', 'Proxmox', 'Ceph', 'Self-hosting'],
    sameAs: [
      'https://github.com/calebsmithdev',
      'https://www.linkedin.com/in/calebsmithdev/',
      'https://x.com/CalebSmithDev',
      'https://bsky.app/profile/did:plc:m2blbfmeq3jyk4jiilzygri7'
    ]
  }
  const graph = []
  if (type === 'article') {
    graph.push(person, {
      '@type': 'BlogPosting',
      '@id': `${url}#blogposting`,
      url,
      headline: title,
      description,
      datePublished,
      dateModified,
      mainEntityOfPage: { '@id': url },
      author: { '@id': person['@id'] },
      image: imageUrl
    })
  }
  else if (normalizePath(path) === '/') {
    graph.push(person, {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url,
      name: 'Caleb Smith',
      description,
      author: { '@id': person['@id'] }
    })
  }

  // A literal '<' could close the script element even inside a JSON string.
  const structuredData = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003c')

  const titleHead = absoluteTitle
    ? { title, titleTemplate: '' }
    : { title }

  useHead({
    ...titleHead,
    link: [
      { rel: 'canonical', href: url }
    ],
    script: graph.length
      ? [{ key: 'site-structured-data', type: 'application/ld+json', innerHTML: structuredData }]
      : []
  })
}
