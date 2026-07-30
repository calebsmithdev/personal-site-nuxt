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
  bodyAttrs: {
    class: 'site-body'
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: defaultDescription }
  ]
})
</script>
