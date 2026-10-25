import { faJsSquare, faSwift, faWordpressSimple } from '@fortawesome/free-brands-svg-icons'
import { faCube, faDharmachakra } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { MarkdownRoot, MinimarkElement, MinimarkNode } from '@nuxt/content'

dayjs.extend(utc)

export interface ContentNode {
  type?: string
  tag?: string
  value?: string
  children?: ContentNode[]
}

type ArticleContent =
  | ContentNode
  | ContentNode[]
  | MarkdownRoot
  | MinimarkNode
  | MinimarkNode[]
  | undefined

interface PathBearingArticle {
  path?: string
}

const countText = (value: string): number => {
  return value.trim().split(/\s+/).filter(Boolean).length
}

const isMinimarkElement = (node: readonly unknown[]): node is MinimarkElement => {
  return typeof node[0] === 'string' &&
    typeof node[1] === 'object' &&
    node[1] !== null &&
    !Array.isArray(node[1])
}

export const countWords = (node: ArticleContent): number => {
  if (!node) { return 0 }
  if (typeof node === 'string') { return countText(node) }
  if (Array.isArray(node)) {
    if (isMinimarkElement(node)) {
      if (node[0] === 'pre') { return 0 }
      return node.slice(2).reduce((total, child) => total + countWords(child), 0)
    }
    return node.reduce((total, child) => total + countWords(child), 0)
  }
  if ('tag' in node && node.tag === 'pre') { return 0 }
  if (node.type === 'text' && node.value) {
    return countText(node.value)
  }
  if (Array.isArray(node.value)) { return countWords(node.value) }
  return countWords('children' in node ? node.children : undefined)
}

export const getReadingMinutes = (
  node: ArticleContent,
  wordsPerMinute = 220
): number => Math.max(1, Math.ceil(countWords(node) / wordsPerMinute))

export const getArticlePosition = <Article extends PathBearingArticle>(
  articles: readonly Article[],
  currentPath: string | undefined
) => {
  const index = articles.findIndex(article => article.path === currentPath)

  return {
    index,
    displayNumber: String(Math.max(0, index) + 1).padStart(2, '0'),
    newer: index > 0 ? articles[index - 1] : null,
    older: index >= 0 && index < articles.length - 1 ? articles[index + 1] : null
  }
}

export const getHomepageArticles = <Article>(
  articles: readonly Article[],
  recentCount = 4
) => ({
  featured: articles[0],
  recent: articles.slice(1, 1 + recentCount)
})

// Content stores date-only strings. Parse them as UTC so every timezone renders the same calendar day.
export const formatArticleDate = (date: Date | string): string => dayjs.utc(date).format('MMMM D, YYYY')

export const articleDateTime = (date: Date | string): string => dayjs.utc(date).format('YYYY-MM-DD')

export const displayCategory = (category: string) => category === 'Javascript' ? 'JavaScript' : category
const categoryIcons: Record<string, IconDefinition> = {
  'Advanced Custom Fields (ACF)': faWordpressSimple,
  Javascript: faJsSquare,
  Kubernetes: faDharmachakra,
  Proxmox: faCube,
  SwiftUI: faSwift,
  WordPress: faWordpressSimple
}
export const categoryIcon = (category: string) => categoryIcons[category] ?? faCube
