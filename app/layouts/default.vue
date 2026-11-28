<template>
  <div>
    <GlobalHeader />
    <slot />
    <GlobalFooter />
  </div>
</template>

<script setup lang="ts">
// Use the configured site origin, like canonical URLs and the feed itself.
const feedUrl = new URL('/rss.xml', useSiteConfig().url).href

useHead({
  link: [
    { rel: 'alternate', type: 'application/rss+xml', title: 'Caleb Smith', href: feedUrl },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicons/apple-touch-icon.png' },
    { rel: 'shortcut icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicons/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicons/favicon-16x16.png' },
    { rel: 'manifest', href: '/favicons/site.webmanifest' },
    { rel: 'mask-icon', href: '/favicons/safari-pinned-tab.svg', color: '#5bbad5' }
  ],
  meta: [
    { name: 'msapplication-TileColor', content: '#da532c' },
    { name: 'msapplication-config', content: '/favicons/browserconfig.xml' },
    { name: 'theme-color', content: '#061426' }
  ]
})
</script>
