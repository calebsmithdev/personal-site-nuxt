export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  if (config.public.googleAnalyticsId) {
    const router = useRouter()
    void import('vue-gtag').then(({ createGtag }) => {
      nuxtApp.vueApp.use(createGtag({
        tagId: config.public.googleAnalyticsId,
        appName: 'Caleb Smith',
        pageTracker: {
          router,
          useScreenview: true
        }
      }))
    }).catch((error) => {
      if (import.meta.dev) {
        console.warn('Unable to load Google Analytics', error)
      }
    })
  }
})
