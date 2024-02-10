<template>
  <div>
    <section class="container pb-5">
      <h2 class="mb-10 section-heading">
        All Blog Posts
      </h2>
      <template v-for="article in articles" :key="article._id">
        <PostPreview :post="article" />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
const { fetchList, articles } = useBlog()

useHead({
  title: 'Blog'
})

await fetchList()
</script>
