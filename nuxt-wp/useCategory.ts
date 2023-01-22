import getCategoryQuery from '~~/graphql/common/getCategory.graphql'

const apiGetCategory = async (categorySlug: string) => {
  const { $graphqlClient } = useNuxtApp()

  const { data } = await $graphqlClient.query({
    query: getCategoryQuery,
    variables: {
      id: categorySlug
    }
  })

  return data.category
}

export default async function useCategory () {
  const route = useRoute()
  const categorySlug = route.params.categorySlug

  const { data: category, refresh } = await useAsyncData(`category-posts-${categorySlug}`, async () => {
    return await apiGetCategory(categorySlug)
  })

  return {
    category,
    refresh
  }
}
