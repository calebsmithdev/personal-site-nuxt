<template>
  <nav class="table-of-contents" aria-label="Table of contents">
    <p class="toc-heading">
      In this field note
    </p>

    <ol class="toc-list">
      <li v-for="link in links" :key="link.id">
        <a
          :href="`#${link.id}`"
          :class="{ 'is-active': link.id === currentItem }"
          :aria-current="link.id === currentItem ? 'location' : undefined"
          @click="currentItem = link.id"
        >
          {{ link.text }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface TocLink {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

const props = defineProps<{
  links: TocLink[]
}>()

const currentItem = ref(props.links[0]?.id ?? '')
let observer: IntersectionObserver | undefined

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    const visibleHeading = entries.find(entry => entry.isIntersecting)
    if (visibleHeading?.target.id) currentItem.value = visibleHeading.target.id
  }, {
    rootMargin: '-12% 0px -72% 0px',
    threshold: 0
  })

  props.links.forEach((link) => {
    const heading = document.getElementById(link.id)
    if (heading) observer?.observe(heading)
  })
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.table-of-contents {
  padding: 2.4rem 0 2.4rem 2.15rem;
  border-left: 1px solid var(--color-rule);
}

.toc-heading {
  margin: 0 0 2rem;
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-left: 1px solid var(--color-rule);
}

.toc-list li {
  margin: 0;
}

.toc-list a {
  position: relative;
  display: block;
  padding: 0.7rem 0 0.7rem 1.35rem;
  color: var(--color-text);
  border: 0;
  font-family: var(--font-heading);
  font-size: 0.88rem;
  line-height: 1.45;
}

.toc-list a::before {
  position: absolute;
  top: 0.55rem;
  bottom: 0.55rem;
  left: -1px;
  width: 2px;
  content: '';
  background: transparent;
}

.toc-list a:hover,
.toc-list a.is-active {
  color: var(--color-cyan);
}

.toc-list a.is-active::before {
  background: var(--color-cyan);
}

@media (max-width: 767px) {
  .table-of-contents {
    padding: 1.5rem 0;
    border-top: 1px solid var(--color-rule);
    border-bottom: 1px solid var(--color-rule);
    border-left: 0;
  }

  .toc-heading {
    margin-bottom: 1rem;
  }

  .toc-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.25rem 1rem;
    border-left: 0;
  }

  .toc-list a {
    padding: 0.45rem 0;
    font-size: 0.8rem;
  }

  .toc-list a::before {
    display: none;
  }
}

@media (max-width: 480px) {
  .toc-list {
    grid-template-columns: 1fr;
  }
}
</style>
