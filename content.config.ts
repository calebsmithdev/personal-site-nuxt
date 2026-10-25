import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { isSocialImageSource } from './app/utils/site'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
// A site-relative path or absolute https URL, used for the article's social image.
const socialImageSource = z.string().refine(isSocialImageSource, 'Use a path starting with / or an https:// URL')

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        date: dateString,
        categories: z.array(z.string().min(1)).min(1),
        image: socialImageSource.optional(),
        imageAlt: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        sitemap: z.object({
          lastmod: dateString
        })
      })
    })
  }
})
