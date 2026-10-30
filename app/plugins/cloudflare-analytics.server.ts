// Server-only, so unconfigured builds ship no analytics code to the browser.
// The client-only 404 shell is therefore not tracked; see README.
export default defineNuxtPlugin(() => {
  const token = useRuntimeConfig().public.cloudflareAnalyticsToken

  if (token) {
    useHead({
      script: [{
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        // Cloudflare's manual snippet is a module script, which is deferred by default.
        type: 'module',
        'data-cf-beacon': JSON.stringify({ token }),
        tagPosition: 'bodyClose'
      }]
    })
  }
})
