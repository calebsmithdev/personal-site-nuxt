import type { Collections } from '@nuxt/content'

export type BlogArticle = Collections['blog']
export type BlogArticleSummary = Pick<
  BlogArticle,
  'id' | 'path' | 'title' | 'description' | 'date' | 'categories'
>
