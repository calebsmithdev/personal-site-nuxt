<template>
  <div>
    <section class="container pb-5">
      <h2 class="mb-10 section-heading">
        {{ category.name }} Blog Posts
      </h2>
      <template v-for="post in posts.edges" :key="post.node.id">
        <PostPreview :post="post.node" />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import useCategory from '~~/nuxt-wp/useCategory'
import usePosts from '~~/nuxt-wp/usePosts'

const { posts, refresh } = await usePosts()
const { category } = await useCategory()

useHead({
  title: 'Blog'
})
</script>
