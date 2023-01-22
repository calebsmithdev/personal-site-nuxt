import getPostQuery from '~~/graphql/common/getPost.graphql'

const apiGetPost = async (slug: string) => {
  const { $graphqlClient } = useNuxtApp()
  const { data } = await $graphqlClient.query({
    query: getPostQuery,
    variables: {
      id: slug
    }
  })

  return data.post
}

export default async function usePost () {
  const route = useRoute()

  const { data: post, refresh } = await useAsyncData(`post-${route.params.postSlug}`, async () => {
    return await apiGetPost(route.params.postSlug)
  })

  return {
    post,
    refresh
  }
}
