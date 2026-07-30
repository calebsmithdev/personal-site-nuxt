import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

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
        image: z.string().optional(),
        tags: z.array(z.string()).optional(),
        sitemap: z.object({
          lastmod: dateString
        })
      })
    })
  }
})
