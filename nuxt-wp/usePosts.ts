import getPostsQuery from '~~/graphql/common/getPosts.graphql'

const apiGetPosts = async (categorySlug: string) => {
  const { $graphqlClient } = useNuxtApp()

  const { data } = await $graphqlClient.query({
    query: getPostsQuery,
    variables: {
      categoryName: categorySlug
    }
  })

  return data.posts
}

export default async function usePosts () {
  const route = useRoute()
  const categorySlug = route.params.categorySlug

  const { data: posts, refresh } = await useAsyncData(`posts-${categorySlug}`, async () => {
    return await apiGetPosts(categorySlug)
  })
  return {
    posts,
    refresh
  }
}
