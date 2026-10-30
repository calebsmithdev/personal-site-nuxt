export default defineNuxtPlugin(() => {
  const token = useRuntimeConfig().public.cloudflareAnalyticsToken

  if (token) {
    useHead({
      script: [{
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        defer: true,
        'data-cf-beacon': JSON.stringify({ token }),
        tagPosition: 'bodyClose'
      }]
    })
  }
})
