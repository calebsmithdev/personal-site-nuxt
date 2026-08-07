import { createGtag } from 'vue-gtag'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  if (config.public.googleAnalyticsId) {
    const router = useRouter()
    nuxtApp.vueApp.use(createGtag({
      tagId: config.public.googleAnalyticsId,
      appName: 'Caleb Smith',
      pageTracker: {
        router,
        useScreenview: true
      }
    }))
  }
})
