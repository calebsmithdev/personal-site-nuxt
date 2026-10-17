<template>
  <svg
    class="svg-inline--fa"
    :viewBox="`0 0 ${icon.icon[0]} ${icon.icon[1]}`"
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path v-for="(path, index) in paths" :key="index" fill="currentColor" :d="path" />
  </svg>
</template>

<script setup lang="ts">
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

// Renders Font Awesome icon data directly so the Font Awesome runtime stays out of the bundle.
const props = defineProps<{
  icon: IconDefinition
}>()

const paths = computed(() => {
  const pathData = props.icon.icon[4]
  return Array.isArray(pathData) ? pathData : [pathData]
})
</script>
