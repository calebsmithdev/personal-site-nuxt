<template>
  <div v-if="$props.filename" class="mt-5 text-sm flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 border-b-0 relative rounded-t-md px-4 py-3 not-prose filename">
    {{ $props.filename }}
  </div>
  <pre :class="$props.class" class="border border-gray-200 dark:border-gray-700 p-5 mb-4 rounded-b-md"><slot /></pre>
</template>

<script setup lang="ts">
defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: null
  },
  filename: {
    type: String,
    default: null
  },
  highlights: {
    type: Array as () => number[],
    default: () => []
  },
  meta: {
    type: String,
    default: null
  },
  class: {
    type: String,
    default: null
  }
})
</script>

<style scoped>
pre :deep(code) {
  display: block;
  font-size: 13px;
}

pre {
  overflow-x: scroll;
}

@media only screen and (min-width: 640px) {
  .filename,
  pre {
    margin-left: -1.5rem;
    margin-right: -1.5rem;
  }
}
</style>