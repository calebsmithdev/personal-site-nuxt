export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('sitemap:resolved', (context) => {
    for (const url of context.urls) {
      // Content discovery also includes Markdown source paths. These are Vite
      // inputs, not public files; retain the URLs discovered from rendered HTML.
      url.images = url.images?.filter(image => !new URL(image.loc, 'https://caleb-smith.dev').pathname.startsWith('/assets/'))
    }
  })
})
