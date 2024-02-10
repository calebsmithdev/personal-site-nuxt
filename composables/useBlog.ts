import type { BlogArticle } from '../types'

export const useBlog = () => {
  const articles = useState<BlogArticle[]>('articles', () => [])

  async function fetchList () {
    if (articles.value.length) {
      return
    }

    try {
      const data = await queryContent<BlogArticle>('blog')
        .where({ _extension: 'md' })
        .without(['body', 'excerpt'])
        .sort({ date: -1 })
        .find()

      articles.value = (data as BlogArticle[]).filter(article => article._path !== '/blog')
    } catch (e) {
      articles.value = []
      return e
    }
  }

  return {
    articles,
    fetchList
  }
}