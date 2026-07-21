<template>
  <img
    v-bind="$props"
    :src="useAsset(src)"
    loading="lazy"
    decoding="async"
  >
</template>

<script setup lang="ts">
defineProps<{
  src: string
  width?: string | number
  height?: string | number
  alt?: string
}>()
</script>
