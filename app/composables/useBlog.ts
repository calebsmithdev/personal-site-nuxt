import type { BlogArticleSummary } from '../types'

export const useBlog = () => {
  const articles = useState<BlogArticleSummary[]>('articles', () => [])

  async function fetchList (): Promise<void> {
    if (articles.value.length) {
      return
    }

    const data = await queryCollection('blog')
      .select('id', 'path', 'title', 'description', 'date', 'categories')
      .order('date', 'DESC')
      .all()

    articles.value = data
  }

  return {
    articles,
    fetchList
  }
}
