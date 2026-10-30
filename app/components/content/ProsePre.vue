<template>
  <div class="code-block">
    <div class="code-toolbar">
      <span>{{ filename || language || 'code' }}</span>
      <button type="button" class="copy-button" :aria-label="copyLabel" @click="copyCode">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="8" width="11" height="11" />
          <path d="M16 8V5H5v11h3" />
        </svg>
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>

    <pre v-bind="attrs" :class="$props.class"><slot /></pre>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  code?: string
  language?: string | null
  filename?: string | null
  highlights?: number[]
  meta?: string | null
  class?: string | null
}>(), {
  code: '',
  language: null,
  filename: null,
  highlights: () => [],
  meta: null,
  class: null
})

const attrs = useAttrs()
const copied = ref(false)
const copyLabel = computed(() => copied.value ? 'Code copied' : 'Copy code')
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const copyCode = async () => {
  await navigator.clipboard.writeText(props.code)
  copied.value = true
  if (copiedTimer) { clearTimeout(copiedTimer) }
  copiedTimer = setTimeout(() => { copied.value = false }, 1800)
}

onBeforeUnmount(() => {
  if (copiedTimer) { clearTimeout(copiedTimer) }
})
</script>

<style scoped>
.code-block {
  margin: 2.5rem 0;
  border: 1px solid var(--color-rule);
  background: #091a2d;
}

.code-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2.75rem;
  padding: 0.55rem 0.85rem 0.55rem 1.2rem;
  color: var(--color-cyan);
  border-bottom: 1px solid var(--color-rule);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.45rem;
  color: var(--color-muted);
  background: transparent;
  border: 0;
  font: inherit;
  cursor: pointer;
}

.copy-button:hover {
  color: var(--color-text);
}

.copy-button svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: square;
  stroke-linejoin: miter;
  stroke-width: 1.5;
}

pre {
  max-width: 100%;
  padding: 1.35rem 1.5rem;
  margin: 0;
  overflow-x: auto;
  color: var(--color-text);
  background: transparent !important;
  font-family: var(--font-mono);
  line-height: 1.65;
  tab-size: 2;
}

pre :deep(code) {
  display: block;
  min-width: max-content;
  font-family: inherit;
  font-size: 0.84rem;
}

@media (max-width: 767px) {
  .code-block {
    width: calc(100% + 1.5rem);
    margin-left: -0.75rem;
  }

  pre {
    padding: 1.15rem;
  }

  pre :deep(code) {
    font-size: 0.78rem;
  }
}
</style>
