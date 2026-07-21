<template>
  <main class="home-page">
    <section class="site-shell hero" aria-labelledby="home-heading">
      <div class="hero-copy">
        <h1 id="home-heading" class="hero-heading">
          I build dependable software and write down what I learn.
        </h1>

        <p class="hero-description">
          Full-stack developer in Kansas, working across modern web platforms and the infrastructure that keeps them running.
        </p>

        <div class="hero-actions">
          <NuxtLink v-if="featuredArticle" :to="featuredArticle._path" class="button button-primary">
            <span>Read the latest article</span>
            <span aria-hidden="true" class="button-arrow"><ArrowRightIcon /></span>
          </NuxtLink>

          <NuxtLink to="/blog" class="text-link">
            Browse all writing
          </NuxtLink>
        </div>
      </div>

      <div class="hero-media">
        <img
          src="~/assets/img/homepage-homelab-v1.png"
          alt="An illustrated homelab workspace with a server rack, laptop, network storage, and connected infrastructure symbols"
          width="1536"
          height="1024"
          fetchpriority="high"
        >
      </div>
    </section>

    <section v-if="featuredArticle" class="site-shell featured-section" aria-labelledby="featured-heading">
      <div class="featured-frame">
        <div class="corner corner-top-left" aria-hidden="true" />
        <div class="corner corner-top-right" aria-hidden="true" />
        <div class="corner corner-bottom-left" aria-hidden="true" />
        <div class="corner corner-bottom-right" aria-hidden="true" />

        <div class="featured-index">
          <p class="section-label">Latest field note</p>
          <span class="article-number" aria-hidden="true">01</span>
        </div>

        <article class="featured-copy">
          <h2 id="featured-heading" class="featured-title">
            <NuxtLink :to="featuredArticle._path">
              {{ featuredArticle.title }}
            </NuxtLink>
          </h2>

          <div class="article-meta">
            <time :datetime="dateTime(featuredArticle.date)">
              <font-awesome-icon :icon="faCalendar" class="meta-icon" aria-hidden="true" />
              <span>{{ formatDate(featuredArticle.date) }}</span>
            </time>
            <span v-for="category in featuredArticle.categories" :key="category" class="article-category">
              <font-awesome-icon :icon="categoryIcon(category)" class="meta-icon" aria-hidden="true" />
              <span>{{ displayCategory(category) }}</span>
            </span>
          </div>

          <p class="featured-description">
            {{ featuredArticle.description }}
          </p>
        </article>

        <NuxtLink :to="featuredArticle._path" class="article-arrow" :aria-label="`Read ${featuredArticle.title}`">
          <span aria-hidden="true"><ArrowRightIcon /></span>
        </NuxtLink>
      </div>
    </section>

    <section v-if="recentArticles.length" class="site-shell writing-section" aria-labelledby="writing-heading">
      <h2 id="writing-heading" class="writing-heading">
        More from the field
      </h2>

      <ol class="article-list">
        <li v-for="(article, index) in recentArticles" :key="article._id" class="article-row">
          <span class="article-number row-number" aria-hidden="true">{{ String(index + 2).padStart(2, '0') }}</span>

          <article class="article-row-copy">
            <h3 class="article-row-title">
              <NuxtLink :to="article._path">
                {{ article.title }}
              </NuxtLink>
            </h3>

            <div class="article-meta">
              <time :datetime="dateTime(article.date)">
                <font-awesome-icon :icon="faCalendar" class="meta-icon" aria-hidden="true" />
                <span>{{ formatDate(article.date) }}</span>
              </time>
              <span v-for="category in article.categories" :key="category" class="article-category">
                <font-awesome-icon :icon="categoryIcon(category)" class="meta-icon" aria-hidden="true" />
                <span>{{ displayCategory(category) }}</span>
              </span>
            </div>
          </article>

          <NuxtLink :to="article._path" class="article-arrow" :aria-label="`Read ${article.title}`">
            <span aria-hidden="true"><ArrowRightIcon /></span>
          </NuxtLink>
        </li>
      </ol>

      <NuxtLink to="/blog" class="all-writing-link">
        <span>See every article</span>
        <span aria-hidden="true"><ArrowRightIcon /></span>
      </NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { faJsSquare, faSwift, faWordpressSimple } from '@fortawesome/free-brands-svg-icons'
import { faCalendar } from '@fortawesome/free-regular-svg-icons'
import { faCube, faDharmachakra } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import ArrowRightIcon from '../components/ArrowRightIcon.vue'
import type { BlogArticle } from '../types'

dayjs.extend(utc)

const { fetchList, articles } = useBlog()

await fetchList()

const featuredArticle = computed(() => articles.value[0])
const recentArticlePaths = [
  '/blog/hiding-field-labels-with-advanced-custom-fields-acf',
  '/blog/previewing-layouts-with-navigation-in-swiftui',
  '/blog/improving-your-class-structures-with-acf-blocks',
  '/blog/capturing-media-events-with-plyr'
]
const recentArticles = computed<BlogArticle[]>(() => {
  const articleByPath = new Map(articles.value.map(article => [article._path, article]))

  return recentArticlePaths.flatMap((path) => {
    const article = articleByPath.get(path)
    return article ? [article] : []
  })
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
</script>

<style scoped>
.home-page {
  overflow: hidden;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  align-items: center;
  gap: clamp(2.5rem, 4vw, 5.5rem);
  min-height: min(47rem, calc(100vh - 5rem));
  padding-top: clamp(4.5rem, 8vw, 8rem);
  padding-bottom: clamp(4.5rem, 8vw, 7rem);
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-heading {
  max-width: 15ch;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(3rem, 4.2vw, 4.6rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

.hero-description {
  max-width: 39rem;
  margin: clamp(1.75rem, 3vw, 2.5rem) 0 0;
  color: var(--color-text);
  font-size: clamp(1.25rem, 1.7vw, 1.65rem);
  line-height: 1.58;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: clamp(2rem, 4vw, 3rem);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 4.5rem;
  padding: 1rem 1.75rem;
  border: 1px solid transparent;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 500;
  line-height: 1.2;
}

.button-primary {
  color: #071426;
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.button-primary:hover {
  color: #071426;
  background: #ff9b79;
  border-color: #ff9b79;
}

.button-arrow,
.article-arrow span,
.all-writing-link span:last-child {
  display: inline-flex;
  transition: transform 180ms ease;
}

.button:hover .button-arrow,
.article-arrow:hover span,
.all-writing-link:hover span:last-child {
  transform: translateX(0.35rem);
}

.text-link,
.all-writing-link {
  color: var(--color-cyan);
  font-family: var(--font-heading);
  font-size: 1.05rem;
  border-bottom-color: currentColor;
}

.hero-media {
  position: relative;
  min-width: 0;
}

.hero-media::before,
.hero-media::after {
  position: absolute;
  z-index: 1;
  width: 2.25rem;
  height: 2.25rem;
  pointer-events: none;
  content: '';
}

.hero-media::before {
  top: -0.65rem;
  left: -0.65rem;
  border-top: 1px solid var(--color-cyan);
  border-left: 1px solid var(--color-cyan);
}

.hero-media::after {
  right: -0.65rem;
  bottom: -0.65rem;
  border-right: 1px solid var(--color-accent);
  border-bottom: 1px solid var(--color-accent);
}

.hero-media img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: 0.2rem;
}

@media (max-height: 800px) and (min-width: 1024px) {
  .hero {
    min-height: 0;
    padding-top: 4.5rem;
    padding-bottom: 4.5rem;
  }
}

.featured-section {
  padding-bottom: clamp(6rem, 10vw, 9rem);
}

.featured-frame {
  position: relative;
  display: grid;
  grid-template-columns: minmax(11.5rem, 0.28fr) minmax(0, 1fr) 3rem;
  align-items: center;
  gap: clamp(2rem, 4vw, 4rem);
  min-height: 19rem;
  padding: clamp(2.25rem, 4vw, 4rem);
  border: 1px solid var(--color-rule);
}

.corner {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  pointer-events: none;
}

.corner-top-left {
  top: -1px;
  left: -1px;
  border-top: 3px solid var(--color-accent);
  border-left: 3px solid var(--color-accent);
}

.corner-top-right {
  top: -1px;
  right: -1px;
  border-top: 3px solid var(--color-accent);
  border-right: 3px solid var(--color-accent);
}

.corner-bottom-left {
  bottom: -1px;
  left: -1px;
  border-bottom: 3px solid var(--color-accent);
  border-left: 3px solid var(--color-accent);
}

.corner-bottom-right {
  right: -1px;
  bottom: -1px;
  border-right: 3px solid var(--color-accent);
  border-bottom: 3px solid var(--color-accent);
}

.featured-index {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: clamp(1.5rem, 3vw, 3rem);
  border-right: 1px solid var(--color-rule);
}

.section-label {
  margin: 0;
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.article-number {
  color: var(--color-number);
  font-family: var(--font-serif);
  font-size: clamp(4.2rem, 6.5vw, 6.8rem);
  font-weight: 500;
  line-height: 0.8;
  letter-spacing: -0.06em;
}

.featured-title {
  max-width: 25ch;
  margin: 0;
  font-size: clamp(2rem, 3vw, 3.15rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.featured-title a,
.article-row-title a {
  border-bottom: 0;
}

.featured-title a:hover,
.article-row-title a:hover {
  color: var(--color-accent);
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 0;
  margin-top: 1.35rem;
  color: var(--color-muted);
  font-family: var(--font-heading);
  font-size: 0.93rem;
  line-height: 1.35;
}

.article-meta > * + * {
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid var(--color-rule);
}

.article-meta time,
.article-category {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-icon {
  width: 1.05rem;
  height: 1.05rem;
}

.article-category {
  color: var(--color-cyan);
}

.featured-description {
  max-width: 46rem;
  margin: 1.35rem 0 0;
  color: var(--color-text);
  font-size: clamp(1.08rem, 1.5vw, 1.3rem);
  line-height: 1.55;
}

.article-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  color: var(--color-accent);
  border: 0;
  font-family: var(--font-heading);
  font-size: 1.65rem;
}

.writing-section {
  padding-bottom: clamp(6rem, 10vw, 9rem);
}

.writing-heading {
  margin: 0 0 clamp(2.5rem, 5vw, 4rem);
  color: var(--color-text);
  font-size: clamp(2.4rem, 4vw, 4rem);
  letter-spacing: -0.035em;
}

.article-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-rule);
}

.article-row {
  display: grid;
  grid-template-columns: minmax(8rem, 0.16fr) minmax(0, 1fr) 3rem;
  align-items: center;
  gap: clamp(2rem, 4vw, 4rem);
  min-height: 10.5rem;
  padding: 2rem 0;
  border-bottom: 1px solid var(--color-rule);
}

.row-number {
  padding-right: clamp(1.5rem, 3vw, 3rem);
  border-right: 1px solid var(--color-rule);
  font-size: clamp(3.8rem, 6vw, 6rem);
}

.article-row-title {
  max-width: 40ch;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.45rem, 2.2vw, 2.1rem);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.article-row-copy .article-meta {
  margin-top: 0.8rem;
}

.all-writing-link {
  display: inline-flex;
  align-items: center;
  gap: 1.2rem;
  margin-top: 2.75rem;
}

@media (max-width: 1023px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 3rem;
    min-height: 0;
  }

  .hero-heading {
    max-width: 14ch;
  }

  .hero-media {
    max-width: 50rem;
  }

  .featured-frame {
    grid-template-columns: minmax(8rem, 0.22fr) minmax(0, 1fr) 3rem;
  }
}

@media (max-width: 767px) {
  .hero {
    padding-top: 4rem;
    padding-bottom: 4.5rem;
  }

  .hero-heading {
    font-size: clamp(2.7rem, 12vw, 4.2rem);
  }

  .hero-description {
    font-size: 1.15rem;
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 1.5rem;
  }

  .button {
    width: 100%;
    min-height: 4rem;
  }

  .hero-media {
    width: calc(100% + 2rem);
    margin-left: -1rem;
  }

  .featured-frame {
    grid-template-columns: 1fr;
    gap: 1.75rem 1rem;
    padding: 2rem 1.5rem;
  }

  .featured-index {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    padding: 0 0 1.5rem;
    border-right: 0;
    border-bottom: 1px solid var(--color-rule);
  }

  .featured-index .article-number {
    font-size: 3.5rem;
  }

  .featured-copy {
    min-width: 0;
    padding-right: 2rem;
  }

  .featured-frame > .article-arrow {
    position: absolute;
    right: 0.75rem;
    bottom: 1.25rem;
  }

  .featured-title {
    font-size: clamp(1.7rem, 8vw, 2.25rem);
  }

  .featured-description {
    font-size: 1.05rem;
  }

  .article-row {
    grid-template-columns: 4.2rem minmax(0, 1fr);
    gap: 1.5rem;
    min-height: 0;
    padding: 2rem 0;
  }

  .row-number {
    align-self: stretch;
    padding: 0 1rem 0 0;
    font-size: 2.75rem;
  }

  .article-row .article-arrow {
    display: none;
  }

  .article-row-title {
    font-size: 1.35rem;
  }

  .article-meta {
    font-size: 0.8rem;
  }

  .article-meta > * + * {
    margin-left: 0.7rem;
    padding-left: 0.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .button-arrow,
  .article-arrow span,
  .all-writing-link span:last-child {
    transition: none;
  }
}
</style>
