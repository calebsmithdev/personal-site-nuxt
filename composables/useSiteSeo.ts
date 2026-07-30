import type { UseSeoMetaInput } from '@unhead/vue'

export interface SiteSeoOptions {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  absoluteTitle?: boolean
}

type SiteSeoMetaInput = UseSeoMetaInput & {
  twitterDomain: string
  twitterUrl: string
}

const SITE_ORIGIN = 'https://caleb-smith.dev'

const normalizePath = (path: string) => {
  const pathWithoutLeadingSlashes = path.replace(/^\/+/, '')
  return pathWithoutLeadingSlashes ? `/${pathWithoutLeadingSlashes}` : '/'
}

export const useSiteSeo = ({
  title,
  description,
  path,
  type = 'website',
  absoluteTitle = false
}: SiteSeoOptions) => {
  const url = `${SITE_ORIGIN}${normalizePath(path)}`
  const seoMeta: SiteSeoMetaInput = {
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: type,
    ogLocale: 'en_US',
    ogUrl: url,
    twitterCard: 'summary_large_image',
    twitterCreator: '@CalebSmithDev',
    twitterSite: '@CalebSmithDev',
    twitterDomain: 'caleb-smith.dev',
    twitterTitle: title,
    twitterDescription: description,
    twitterUrl: url
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
