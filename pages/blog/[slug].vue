<template>
  <main class="article-page">
    <div class="site-shell article-shell">
      <NuxtLink to="/blog" class="back-link">
        <span aria-hidden="true" class="back-arrow"><ArrowRightIcon /></span>
        <span>All writing</span>
      </NuxtLink>

      <div class="article-grid">
        <aside v-if="tocLinks.length" class="desktop-toc">
          <PostTableOfContents :links="tocLinks" />
        </aside>

        <div class="article-column">
          <header class="article-masthead">
            <div class="field-note-rule" aria-hidden="true">
              <span class="field-note-label">Field note</span>
              <span class="field-note-number">{{ articleNumber }}</span>
              <span class="field-note-line" />
              <span class="field-note-end" />
            </div>

            <h1>{{ article.title }}</h1>

            <p class="article-description">
              {{ article.description }}
            </p>

            <div class="article-meta">
              <time :datetime="dateTime(article.date)">
                <font-awesome-icon :icon="faCalendar" class="meta-icon" aria-hidden="true" />
                <span>{{ formatDate(article.date) }}</span>
              </time>

              <span
                v-for="category in article.categories"
                :key="category"
                class="article-category"
              >
                <font-awesome-icon :icon="categoryIcon(category)" class="meta-icon" aria-hidden="true" />
                <span>{{ displayCategory(category) }}</span>
              </span>

              <span class="reading-time">
                <font-awesome-icon :icon="faClock" class="meta-icon" aria-hidden="true" />
                <span>{{ readingMinutes }} min read</span>
              </span>
            </div>
          </header>

          <PostTableOfContents
            v-if="tocLinks.length"
            :links="tocLinks"
            class="mobile-toc"
          />

          <article id="full-content" class="article-body">
            <ContentRenderer v-if="article.body" :value="article" />
          </article>

          <div class="author-signoff">
            <p>Written by Caleb Smith</p>
            <span>Full-stack developer in Kansas.</span>
          </div>

          <nav v-if="newerArticle || olderArticle" class="article-navigation" aria-label="Adjacent articles">
            <NuxtLink
              v-if="newerArticle"
              :to="newerArticle._path"
              class="adjacent-link adjacent-link-newer"
            >
              <span aria-hidden="true" class="adjacent-arrow adjacent-arrow-left"><ArrowRightIcon /></span>
              <span>
                <span class="adjacent-label">Previous field note</span>
                <span class="adjacent-title">{{ newerArticle.title }}</span>
              </span>
            </NuxtLink>

            <NuxtLink
              v-if="olderArticle"
              :to="olderArticle._path"
              class="adjacent-link adjacent-link-older"
            >
              <span>
                <span class="adjacent-label">Next field note</span>
                <span class="adjacent-title">{{ olderArticle.title }}</span>
              </span>
              <span aria-hidden="true" class="adjacent-arrow"><ArrowRightIcon /></span>
            </NuxtLink>
          </nav>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { faJsSquare, faSwift, faWordpressSimple } from '@fortawesome/free-brands-svg-icons'
import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons'
import { faCube, faDharmachakra } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import ArrowRightIcon from '../../components/ArrowRightIcon.vue'
import type { BlogArticle } from '../../types'

interface TocLink {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

interface ContentNode {
  type?: string
  tag?: string
  value?: string
  children?: ContentNode[]
}

dayjs.extend(utc)

const route = useRoute()
const { fetchList, articles } = useBlog()

const { data: article } = await useAsyncData(route.path, () => queryContent<BlogArticle>(route.path).findOne())
if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Blog post not found', fatal: true })
}

await fetchList()

const currentIndex = computed(() => articles.value.findIndex(item => item._path === article.value?._path))
const articleNumber = computed(() => String(Math.max(0, currentIndex.value) + 1).padStart(2, '0'))
const newerArticle = computed(() => currentIndex.value > 0 ? articles.value[currentIndex.value - 1] : null)
const olderArticle = computed(() => (
  currentIndex.value >= 0 && currentIndex.value < articles.value.length - 1
    ? articles.value[currentIndex.value + 1]
    : null
))

const tocLinks = computed<TocLink[]>(() => {
  const body = article.value?.body as { toc?: { links?: TocLink[] } } | undefined
  return body?.toc?.links ?? []
})

const countWords = (node: ContentNode | ContentNode[] | undefined): number => {
  if (!node) return 0
  if (Array.isArray(node)) return node.reduce((total, child) => total + countWords(child), 0)
  if (node.tag === 'pre') return 0
  if (node.type === 'text' && node.value) return node.value.trim().split(/\s+/).filter(Boolean).length
  return countWords(node.children)
}

const readingMinutes = computed(() => {
  const body = article.value?.body as ContentNode | undefined
  return Math.max(1, Math.ceil(countWords(body) / 220))
})

const formatDate = (date: Date | string) => dayjs(date).utc().format('MMMM D, YYYY')
const dateTime = (date: Date | string) => dayjs(date).utc().format('YYYY-MM-DD')
const displayCategory = (category: string) => category === 'Javascript' ? 'JavaScript' : category
const categoryIcons: Record<string, IconDefinition> = {
  'Advanced Custom Fields (ACF)': faWordpressSimple,
  'Javascript': faJsSquare,
  'Kubernetes': faDharmachakra,
  'Proxmox': faCube,
  'SwiftUI': faSwift,
  'WordPress': faWordpressSimple
}
const categoryIcon = (category: string) => categoryIcons[category] ?? faCube

useHead({
  title: article.value.title,
  titleTemplate: '',
  meta: [
    { property: 'og:title', content: article.value.title },
    { property: 'og:description', content: article.value.description },
    { property: 'og:type', content: 'article' },
    { property: 'og:locale', content: 'en_US' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:creator', content: '@CalebSmithDev' },
    { name: 'twitter:site', content: '@CalebSmithDev' },
    { name: 'description', content: article.value.description }
  ],
  link: [
    { rel: 'canonical', href: 'https://caleb-smith.dev' + route.path }
  ]
})
</script>

<style scoped>
.article-page {
  overflow: clip;
}

.article-shell {
  padding-top: clamp(3rem, 5vw, 5rem);
  padding-bottom: clamp(6rem, 10vw, 10rem);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
  color: var(--color-accent);
  border: 0;
  font-family: var(--font-heading);
  font-size: 1rem;
}

.back-link:hover {
  color: #ff9b79;
}

.back-arrow {
  display: inline-flex;
  transform: rotate(180deg);
  transition: transform 180ms ease;
}

.back-link:hover .back-arrow {
  transform: rotate(180deg) translateX(0.25rem);
}

.article-grid {
  display: grid;
  grid-template-columns: minmax(13rem, 17rem) minmax(0, 1fr);
  gap: clamp(3rem, 6vw, 6.5rem);
}

.desktop-toc {
  min-width: 0;
}

.desktop-toc > * {
  position: sticky;
  top: 2rem;
}

.article-column {
  min-width: 0;
}

.article-masthead {
  padding-bottom: clamp(3rem, 6vw, 5rem);
  border-bottom: 1px solid var(--color-rule);
}

.field-note-rule {
  display: grid;
  grid-template-columns: auto auto minmax(3rem, 1fr) 1rem;
  align-items: center;
  gap: 1rem;
  margin-bottom: clamp(2rem, 3vw, 3rem);
}

.field-note-label,
.field-note-number {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.field-note-label {
  color: var(--color-accent);
}

.field-note-number {
  color: var(--color-subtle);
}

.field-note-line {
  height: 1px;
  background: var(--color-rule);
}

.field-note-end {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-cyan);
}

.article-masthead h1 {
  max-width: 17ch;
  margin: 0;
  font-size: clamp(3.25rem, 5.2vw, 5.4rem);
  line-height: 1.07;
  letter-spacing: -0.05em;
}

.article-description {
  max-width: 38ch;
  margin: clamp(1.5rem, 2.5vw, 2.25rem) 0 0;
  color: var(--color-text);
  font-size: clamp(1.45rem, 2.3vw, 2.1rem);
  line-height: 1.45;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 0;
  margin-top: clamp(1.75rem, 3vw, 2.5rem);
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1rem;
}

.article-meta > * {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}

.article-meta > * + * {
  margin-left: 1.25rem;
  padding-left: 1.25rem;
  border-left: 1px solid var(--color-rule);
}

.article-category {
  color: var(--color-cyan);
}

.article-category:nth-of-type(even) {
  color: var(--color-accent);
}

.meta-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.mobile-toc {
  display: none;
}

.article-body {
  max-width: 49rem;
  padding-top: clamp(3rem, 6vw, 5rem);
  color: var(--color-text);
  font-size: clamp(1.1rem, 1.4vw, 1.25rem);
  line-height: 1.85;
}

.article-body :deep(p) {
  margin-bottom: 1.65rem;
  font-size: inherit;
}

.article-body :deep(h2),
.article-body :deep(h3) {
  scroll-margin-top: 2rem;
  max-width: 24ch;
  letter-spacing: -0.03em;
}

.article-body :deep(h2) {
  margin: clamp(4.5rem, 8vw, 7rem) 0 1.5rem;
  font-size: clamp(2.3rem, 4vw, 3.7rem);
  line-height: 1.12;
}

.article-body :deep(h3) {
  margin: clamp(3rem, 6vw, 5rem) 0 1.2rem;
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  line-height: 1.2;
}

.article-body :deep(h2 a),
.article-body :deep(h3 a) {
  color: inherit;
  border: 0;
}

.article-body :deep(a) {
  color: var(--color-cyan);
  border-bottom-color: currentColor;
}

.article-body :deep(strong) {
  color: var(--color-text);
  font-weight: 700;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin: 1.25rem 0 2rem;
  padding-left: 1.4rem;
  list-style-position: outside;
}

.article-body :deep(ol) {
  list-style-type: decimal;
}

.article-body :deep(ul) {
  list-style-type: disc;
}

.article-body :deep(li) {
  padding-left: 0.5rem;
  margin-bottom: 0.65rem;
}

.article-body :deep(li::marker) {
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-weight: 700;
}

.article-body :deep(code:not(pre code)) {
  padding: 0.12em 0.38em;
  color: var(--color-cyan);
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.88em;
}

.article-body :deep(blockquote) {
  margin: 2.5rem 0;
  padding: 0.35rem 0 0.35rem 1.75rem;
  color: var(--color-text);
  border-left: 3px solid var(--color-accent);
  font-size: 1.2em;
}

.article-body :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.article-body :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  margin: 3rem 0;
  border: 1px solid var(--color-rule);
}

.article-body :deep(iframe) {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  margin: 2.5rem 0;
  border: 1px solid var(--color-rule);
}

.author-signoff {
  max-width: 49rem;
  padding: 1.4rem 0;
  margin-top: clamp(4rem, 8vw, 7rem);
  border-top: 1px solid var(--color-rule);
  border-bottom: 1px solid var(--color-rule);
}

.author-signoff p {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
}

.author-signoff span {
  display: block;
  margin-top: 0.3rem;
  color: var(--color-subtle);
  font-family: var(--font-heading);
  font-size: 0.95rem;
}

.article-navigation {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 64rem;
  margin-top: clamp(3rem, 6vw, 5rem);
  border-top: 1px solid var(--color-rule);
  border-bottom: 1px solid var(--color-rule);
}

.adjacent-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 1.5rem;
  min-height: 10rem;
  padding: 1.75rem 0;
  border: 0;
}

.adjacent-link-older {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-column: 2;
  padding-left: clamp(1.5rem, 4vw, 3rem);
  text-align: right;
  border-left: 1px solid var(--color-rule);
}

.adjacent-link-newer {
  padding-right: clamp(1.5rem, 4vw, 3rem);
}

.adjacent-label,
.adjacent-title {
  display: block;
}

.adjacent-label {
  margin-bottom: 0.55rem;
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.adjacent-title {
  color: var(--color-text);
  font-size: clamp(1.15rem, 2vw, 1.5rem);
  line-height: 1.35;
}

.adjacent-arrow {
  display: inline-flex;
  color: var(--color-accent);
  font-size: 1.6rem;
  transition: transform 180ms ease;
}

.adjacent-arrow-left {
  transform: rotate(180deg);
}

.adjacent-link:hover .adjacent-arrow:not(.adjacent-arrow-left) {
  transform: translateX(0.3rem);
}

.adjacent-link:hover .adjacent-arrow-left {
  transform: rotate(180deg) translateX(0.3rem);
}

.adjacent-link:hover .adjacent-title {
  color: var(--color-accent);
}

@media (max-width: 1023px) {
  .article-grid {
    grid-template-columns: minmax(11rem, 13rem) minmax(0, 1fr);
    gap: 3rem;
  }

  .article-masthead h1 {
    font-size: clamp(3.25rem, 6.5vw, 4.8rem);
  }
}

@media (max-width: 767px) {
  .article-shell {
    padding-top: 2.5rem;
    padding-bottom: 6rem;
  }

  .back-link {
    margin-bottom: 2.5rem;
  }

  .article-grid {
    display: block;
  }

  .desktop-toc {
    display: none;
  }

  .field-note-rule {
    grid-template-columns: auto auto minmax(2rem, 1fr) 0.8rem;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .field-note-label,
  .field-note-number {
    font-size: 0.72rem;
  }

  .field-note-end {
    width: 0.8rem;
    height: 0.8rem;
  }

  .article-masthead {
    padding-bottom: 2.5rem;
  }

  .article-masthead h1 {
    font-size: clamp(2.65rem, 12vw, 4rem);
  }

  .article-description {
    font-size: 1.3rem;
  }

  .article-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.9rem;
    font-size: 0.9rem;
  }

  .article-meta > * + * {
    margin-left: 0;
    padding-left: 0;
    border-left: 0;
  }

  .mobile-toc {
    display: block;
    margin-top: 2rem;
  }

  .article-body {
    padding-top: 2.5rem;
    font-size: 1.08rem;
    line-height: 1.78;
  }

  .article-body :deep(h2) {
    margin-top: 4rem;
  }

  .article-body :deep(h3) {
    margin-top: 3rem;
  }

  .article-navigation {
    grid-template-columns: 1fr;
  }

  .adjacent-link,
  .adjacent-link-older,
  .adjacent-link-newer {
    grid-column: 1;
    min-height: 0;
    padding: 1.75rem 0;
    border-left: 0;
    text-align: left;
  }

  .adjacent-link-older {
    grid-template-columns: minmax(0, 1fr) auto;
    border-top: 1px solid var(--color-rule);
  }
}

@media (prefers-reduced-motion: reduce) {
  .back-arrow,
  .adjacent-arrow {
    transition: none;
  }
}
</style>
