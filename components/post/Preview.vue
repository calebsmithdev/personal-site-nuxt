<template>
  <article class="post-preview">
    <span class="post-number" aria-hidden="true">{{ String(index).padStart(2, '0') }}</span>

    <div class="post-copy">
      <h2>
        <NuxtLink :to="post._path">
          {{ post.title }}
        </NuxtLink>
      </h2>

      <div class="post-meta">
        <time :datetime="dateTime(post.date)">
          <font-awesome-icon :icon="faCalendar" aria-hidden="true" />
          <span>{{ formatDate(post.date) }}</span>
        </time>
        <span v-for="category in post.categories" :key="category" class="post-category">
          {{ displayCategory(category) }}
        </span>
      </div>

      <p>{{ post.description }}</p>
    </div>

    <NuxtLink :to="post._path" class="post-arrow" :aria-label="`Read ${post.title}`">
      <span aria-hidden="true"><ArrowRightIcon /></span>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { faCalendar } from '@fortawesome/free-regular-svg-icons'
import ArrowRightIcon from '../ArrowRightIcon.vue'
import type { BlogArticle } from '../../types'

dayjs.extend(utc)

defineProps<{
  post: BlogArticle
  index: number
}>()

const formatDate = (date: Date | string) => dayjs(date).utc().format('MMMM D, YYYY')
const dateTime = (date: Date | string) => dayjs(date).utc().format('YYYY-MM-DD')
const displayCategory = (category: string) => category === 'Javascript' ? 'JavaScript' : category
</script>

<style scoped>
.post-preview {
  display: grid;
  grid-template-columns: minmax(7rem, 0.14fr) minmax(0, 1fr) 3rem;
  align-items: center;
  gap: clamp(2rem, 4vw, 4rem);
  min-height: 14rem;
  padding: 2.5rem 0;
  border-bottom: 1px solid var(--color-rule);
}

.post-number {
  align-self: stretch;
  display: flex;
  align-items: center;
  color: var(--color-number);
  border-right: 1px solid var(--color-rule);
  font-family: var(--font-serif);
  font-size: clamp(3.5rem, 6vw, 6.5rem);
  font-weight: 500;
  line-height: 0.8;
  letter-spacing: -0.06em;
}

.post-copy h2 {
  max-width: 34ch;
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.75rem);
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.post-copy h2 a {
  border: 0;
}

.post-copy h2 a:hover {
  color: var(--color-accent);
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 0;
  margin-top: 1.1rem;
  color: var(--color-muted);
  font-family: var(--font-heading);
  font-size: 0.85rem;
}

.post-meta > * {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.post-meta > * + * {
  margin-left: 0.85rem;
  padding-left: 0.85rem;
  color: var(--color-cyan);
  border-left: 1px solid var(--color-rule);
}

.post-copy p {
  max-width: 47rem;
  margin: 1rem 0 0;
  color: var(--color-text);
  font-size: 1.05rem;
  line-height: 1.6;
}

.post-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  color: var(--color-accent);
  border: 0;
  font-size: 1.6rem;
}

.post-arrow span {
  display: inline-flex;
  transition: transform 180ms ease;
}

.post-arrow:hover span {
  transform: translateX(0.35rem);
}

@media (max-width: 767px) {
  .post-preview {
    grid-template-columns: 3.5rem minmax(0, 1fr);
    gap: 1.25rem;
    min-height: 0;
    padding: 2.25rem 0;
  }

  .post-number {
    align-items: flex-start;
    padding-top: 0.2rem;
    font-size: 2.4rem;
  }

  .post-copy h2 {
    font-size: 1.5rem;
  }

  .post-copy p {
    font-size: 0.98rem;
  }

  .post-arrow {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-arrow span {
    transition: none;
  }
}
</style>
