<template>
  <div class="pb-16">
    <div class="flex items-center pb-3 space-x-3">
      <NuxtLink v-for="category in categories" :key="category.id" :to="category.uri" class="border-b-0">
        <div class="uppercase py-1 px-3 border dark:border-white dark:text-white rounded text-xs">
          {{ category.name }}
        </div>
      </NuxtLink>
    </div>
    <NuxtLink :to="`/blog/${post.slug}`">
      <div class="">
        <h3 class="font-medium mb-2 mt-0">
          {{ post.title }}
        </h3>
        <div class="mb-4" v-html="post.excerpt" />
        <p class="font-medium">
          Read More
        </p>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  post: {
    type: Object,
    default: () => ({})
  }
})

const categories = computed(() => props.post.terms.nodes)
</script>
