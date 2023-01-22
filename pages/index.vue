<template>
  <div>
    <section class="container py-5">
      <h2 class="mb-10 section-heading">
        Recently Published
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
</script>
