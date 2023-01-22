import { defineNuxtPlugin } from '#app'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const fetchPolicy = 'no-cache'
  const graphqlClient = new ApolloClient({
    // Provide required constructor fields
    link: new HttpLink({
      uri: config.public.wordpressBaseUrl + '/graphql'
    }),
    cache: new InMemoryCache({
      addTypename: false
    }),
    connectToDevTools: true,
    assumeImmutableResults: true,
    queryDeduplication: false,
    defaultOptions: {
      watchQuery: { fetchPolicy },
      query: { fetchPolicy }
    }
  })
  return {
    provide: {
      graphqlClient
    }
  }
})
