import type { BlogArticle } from '../types'

export const useBlog = () => {
  const articles = useState<BlogArticle[]>('articles', () => [])

  async function fetchList (): Promise<void> {
    if (articles.value.length) {
      return
    }

    const data = await queryContent<BlogArticle>('blog')
      .where({ _extension: 'md' })
      .without(['body', 'excerpt'])
      .sort({ date: -1 })
      .find()

    articles.value = (data as BlogArticle[]).filter(article => article._path !== '/blog')
  }

  return {
    articles,
    fetchList
  }
}
