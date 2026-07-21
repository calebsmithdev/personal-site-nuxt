<template>
  <main class="writing-page">
    <section class="site-shell writing-intro" aria-labelledby="writing-title">
      <div>
        <h1 id="writing-title">
          Writing from the field.
        </h1>
        <p>
          Practical notes on building for the web, maintaining infrastructure, and solving the small problems worth documenting.
        </p>
      </div>

      <span class="writing-count" aria-label="Article count">
        {{ String(articles.length).padStart(2, '0') }} field notes
      </span>
    </section>

    <section class="site-shell article-index" aria-label="All articles">
      <ol>
        <li v-for="(article, index) in articles" :key="article._id">
          <PostPreview :post="article" :index="index + 1" />
        </li>
      </ol>
    </section>
  </main>
</template>

<script setup lang="ts">
const { fetchList, articles } = useBlog()

useHead({
  title: 'Writing',
  meta: [
    {
      name: 'description',
      content: 'Practical field notes from Caleb Smith on web development, infrastructure, Kubernetes, WordPress, and SwiftUI.'
    }
  ]
})

await fetchList()
</script>

<style scoped>
.writing-page {
  overflow: clip;
}

.writing-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4rem;
  padding-top: clamp(5rem, 9vw, 9rem);
  padding-bottom: clamp(4rem, 7vw, 6.5rem);
}

.writing-intro h1 {
  max-width: 12ch;
  margin: 0;
  font-size: clamp(3.5rem, 7vw, 6.8rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.writing-intro p {
  max-width: 39rem;
  margin: 2rem 0 0;
  color: var(--color-text);
  font-size: clamp(1.2rem, 1.8vw, 1.55rem);
  line-height: 1.6;
}

.writing-count {
  flex: 0 0 auto;
  padding-bottom: 0.6rem;
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.article-index {
  padding-bottom: clamp(6rem, 10vw, 10rem);
}

.article-index ol {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-rule);
}

.article-index li {
  margin: 0;
}

@media (max-width: 767px) {
  .writing-intro {
    align-items: flex-start;
    flex-direction: column;
    gap: 2rem;
    padding-top: 4rem;
    padding-bottom: 4rem;
  }

  .writing-intro h1 {
    font-size: clamp(3rem, 15vw, 5rem);
  }

  .writing-intro p {
    font-size: 1.1rem;
  }
}
</style>
