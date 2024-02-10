<template>
  <div class="pb-16">
    <div class="flex items-center pb-3 space-x-3">
      <NuxtLink v-for="category in post.categories" :key="category" :to="category" class="border-b-0">
        <div class="uppercase py-1 px-3 border dark:border-white dark:text-white rounded text-xs">
          {{ category }}
        </div>
      </NuxtLink>
    </div>
    <NuxtLink :to="post._path">
      <div class="">
        <h3 class="mb-2 mt-0">
          {{ post.title }}
        </h3>
        <div class="text-sm mb-3 uppercase font-heading">{{ dayjs(post.date).format('MMMM D, YYYY') }}</div>
        <div class="mb-4">{{ post.description }}</div>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

const props = defineProps({
  post: {
    type: Object,
    default: () => ({})
  }
})
</script>
