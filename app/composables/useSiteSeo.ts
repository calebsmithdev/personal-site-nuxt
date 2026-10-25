import type { UseSeoMetaInput } from '@unhead/vue'
import { defaultSocialImage, type SocialImage } from '../utils/site'

export interface SiteSeoOptions {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  absoluteTitle?: boolean
  image?: SocialImage
}

type SiteSeoMetaInput = UseSeoMetaInput & {
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
  image = defaultSocialImage
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
    twitterCard: 'summary_large_image',
    twitterCreator: '@CalebSmithDev',
    twitterSite: '@CalebSmithDev',
    twitterDomain: new URL(origin).hostname,
    twitterTitle: title,
    twitterDescription: description,
    twitterUrl: url,
    twitterImage: { url: imageUrl, alt: image.alt }
  }

  useSeoMeta(seoMeta)

  const titleHead = absoluteTitle
    ? { title, titleTemplate: '' }
    : { title }

  useHead({
    ...titleHead,
    link: [
      { rel: 'canonical', href: url }
    ]
  })
}
