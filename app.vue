<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const defaultDescription = 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.'

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
    class: 'site-body'
  },
  meta: [
    { name: 'description', content: defaultDescription },

    // Facebook
    { name: 'og:url', content: 'https://caleb-smith.dev' },
    { name: 'og:title', content: 'Full Stack Web Developer | Caleb Smith' },
    { name: 'og:description', content: defaultDescription },
    { name: 'og:type', content: 'website' },
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
