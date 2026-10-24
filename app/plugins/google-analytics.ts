export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()

  if (config.public.googleAnalyticsId) {
    const router = useRouter()
    const { createGtag } = await import('vue-gtag')
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
