import getClapsQuery from '~~/graphql/queries/getClaps.graphql'
import clapsMutation from '~~/graphql/mutations/claps.graphql'

const apiGetClaps = async (slug: string) => {
  const { $graphqlClient } = useNuxtApp()
  const { data } = await $graphqlClient.query({
    query: getClapsQuery,
    variables: {
      id: slug
    }
  })

  return data.post
}

const apiAddClaps = async (claps: number, postId: number, userId: string) => {
  const { $graphqlClient } = useNuxtApp()
  const { data } = await $graphqlClient.mutate({
    mutation: clapsMutation,
    variables: {
      claps,
      targetPostId: postId,
      userId
    }
  })

  return data.post
}

export default async function useClaps () {
  const route = useRoute()

  const { data: post, refresh } = await useAsyncData(`claps-${route.params.postSlug}`, async () => {
    return await apiGetClaps(route.params.postSlug)
  })

  return {
    claps: post.value?.totalClaps ? Number.parseInt(post.value.totalClaps) : 0,
    refresh,
    addClap: apiAddClaps
  }
}
