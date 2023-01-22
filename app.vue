<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute()

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Caleb Smith` : 'Full Stack Web Developer | Caleb Smith'
  },
  htmlAttrs: {
    lang: 'en'
  },
  viewport: 'width=device-width, initial-scale=1',
  charset: 'utf-8',
  bodyAttrs: {
    class: 'bg-gray-900'
  },
  meta: [
    { name: 'description', content: route.meta.description ?? 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.' },

    // Facebook
    { name: 'og:url', content: 'https://caleb-smith.dev' },
    { name: 'og:title', content: `${route.meta.title} | Caleb Smith` },
    { name: 'og:description', content: route.meta.description ?? 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.' },
    { name: 'og:type', content: route.meta.ogType ?? 'website' },
    { name: 'og:locale', content: 'en_US' },

    // Twitter
    { name: 'twitter:domain', content: 'caleb-smith.dev' },
    { name: 'twitter:url', content: 'https://caleb-smith.dev/' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:creator', content: '@CalebSmithDev' },
    { name: 'twitter:site', content: '@CalebSmithDev' }
  ]
})
</script>
