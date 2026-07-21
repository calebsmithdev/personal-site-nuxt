import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface BlogArticle extends ParsedContent {
  description: string
  date: Date | string
  image?: string
  tags?: string[]
  categories: string[]
}
