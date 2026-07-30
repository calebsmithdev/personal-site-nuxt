export interface ContentNode {
  type?: string
  tag?: string
  value?: string
  children?: ContentNode[]
}

interface PathBearingArticle {
  _path?: string
}

export const countWords = (node: ContentNode | ContentNode[] | undefined): number => {
  if (!node) { return 0 }
  if (Array.isArray(node)) { return node.reduce((total, child) => total + countWords(child), 0) }
  if (node.tag === 'pre') { return 0 }
  if (node.type === 'text' && node.value) {
    return node.value.trim().split(/\s+/).filter(Boolean).length
  }
  return countWords(node.children)
}

export const getReadingMinutes = (
  node: ContentNode | ContentNode[] | undefined,
  wordsPerMinute = 220
): number => Math.max(1, Math.ceil(countWords(node) / wordsPerMinute))

export const getArticlePosition = <Article extends PathBearingArticle>(
  articles: readonly Article[],
  currentPath: string | undefined
) => {
  const index = articles.findIndex(article => article._path === currentPath)

  return {
    index,
    displayNumber: String(Math.max(0, index) + 1).padStart(2, '0'),
    newer: index > 0 ? articles[index - 1] : null,
    older: index >= 0 && index < articles.length - 1 ? articles[index + 1] : null
  }
}
