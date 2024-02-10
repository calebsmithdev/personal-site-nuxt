<template>
  <div class="container flex space-x-16">
    <div class="w-full md:w-9/12">
      <h1>{{ article?.title }}</h1>
      <div class="flex items-center space-x-3 mb-10">
        <div class="modified-date">
          Posted on {{ dayjs(article?.date).format('MMMM D, YYYY') }}
        </div>
        <div class="flex items-center space-x-3">
          <NuxtLink v-for="category in article?.categories" :key="category" :to="category" class="border-b-0">
            <div class="uppercase py-1 px-3 border dark:border-white dark:text-white rounded text-xs">
              {{ category }}
            </div>
          </NuxtLink>
        </div>
      </div>

      <div id="full-content" ref="htmlContext">
        <h2 id="introduction" class="m-0 p-0" />
        <ContentRenderer v-if="article && article.body" :value="article" />
      </div>

      <!-- <div class="flex items-center justify-between">
        <div>
          <p class="mb-1 text-sm text-slate-400 uppercase">
            Last updated
          </p>
          <p class="text-lg font-bold">
            {{ dayjs(post.modified).format('MMMM D, YYYY') }}
          </p>
        </div>
      </div> -->
    </div>
    <div class="w-full md:w-3/12">
      <div class="sidebar">
        <!-- <PostTableOfContents :post="post" :html-context="htmlContext" /> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { BlogArticle } from '../../types'

const route = useRoute()

const { data: article } = await useAsyncData(route.path, () => queryContent<BlogArticle>(route.path).findOne())
if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Blog post not found', fatal: true })
}

useHead({
  title: article.value.title,
  titleTemplate: '',
  meta: [
    { name: 'og:title', content: article.value.title },
    { name: 'og:description', content: article.value.description },
    { name: 'og:type', content: 'blog' },
    { name: 'og:locale', content: 'en_US' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:creator', content: '@CalebSmithDev' },
    { name: 'twitter:site', content: '@CalebSmithDev' },
    { name: 'description', content: article.value.description }
  ],
  link: [
    { rel: 'canonical', href: 'https://caleb-smith.dev' + route.path }
  ]
})

const htmlContext = ref(null)
</script>

<style scoped>
  :deep(a) {
    border-color: transparent;
  }

  :deep(a):hover {
    border-color: currentColor;
  }

  .sidebar {
    top: 30px;
    position: sticky;
  }

  :deep(iframe) {
    width: 100%;
    height: 395px;
  }
</style>
