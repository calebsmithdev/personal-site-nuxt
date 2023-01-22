<template>
  <div>
    <section class="container pb-5">
      <h2 class="mb-10 section-heading">
        All Blog Posts
      </h2>
      <template v-for="post in posts.edges" :key="post.node.id">
        <PostPreview :post="post.node" />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import usePosts from '~~/nuxt-wp/usePosts'

const { posts, refresh } = await usePosts()

useHead({
  title: 'Blog'
})
</script>
