<template>
  <div class="terminal" role="group" aria-label="Terminal summary of Caleb's stack and recent field notes">
    <div class="terminal-bar" aria-hidden="true">
      <span class="terminal-dot" />
      <span class="terminal-dot" />
      <span class="terminal-dot" />
      <span class="terminal-title">caleb@kansas: ~</span>
    </div>

    <div class="terminal-body">
      <p class="line command" style="--step: 0">
        <span class="prompt" aria-hidden="true">$</span>
        <span class="typed">whoami</span>
      </p>
      <p class="line output" style="--step: 1">
        Caleb Smith · full-stack developer
      </p>

      <p class="line command" style="--step: 2">
        <span class="prompt" aria-hidden="true">$</span>
        <span class="typed">cat stack.txt</span>
      </p>
      <p class="line output stack" style="--step: 3">
        <span v-for="item in stack" :key="item">{{ item }}</span>
      </p>

      <template v-if="notes.length">
        <p class="line command" style="--step: 4">
          <span class="prompt" aria-hidden="true">$</span>
          <span class="typed">ls -t field-notes/ | head -{{ notes.length }}</span>
        </p>
        <ul class="line output notes" style="--step: 5">
          <li v-for="note in notes" :key="note.path">
            <time :datetime="note.date">{{ note.date }}</time>
            <NuxtLink :to="note.path" :aria-label="`${note.slug}: ${note.title}`">
              {{ note.slug }}
            </NuxtLink>
          </li>
        </ul>
      </template>

      <p class="line command" style="--step: 6" aria-hidden="true">
        <span class="prompt">$</span>
        <span class="caret" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlogArticleSummary } from '../types'
import { articleDateTime } from '../utils/article'

const props = defineProps<{
  articles: BlogArticleSummary[]
}>()

const stack = ['vue', 'nuxt', 'react', 'php', 'wordpress', '.net', 'swiftui', 'kubernetes', 'proxmox']

const notes = computed(() => props.articles.slice(0, 3).map(article => ({
  path: article.path,
  title: article.title,
  slug: article.path.split('/').pop() ?? article.path,
  date: articleDateTime(article.date)
})))
</script>

<style scoped>
.terminal {
  position: relative;
  min-width: 0;
  color: var(--color-muted);
  background: #030c18;
  border: 1px solid var(--color-rule);
  border-radius: 0.35rem;
  box-shadow:
    0 0 0 1px rgb(103 215 236 / 6%),
    0 2.5rem 6rem -3rem rgb(103 215 236 / 40%);
  font-family: var(--font-mono);
  font-size: clamp(0.82rem, 1vw, 0.95rem);
  line-height: 1.7;
}

.terminal-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-rule);
}

.terminal-dot {
  width: 0.65rem;
  height: 0.65rem;
  background: var(--color-rule);
  border-radius: 50%;
}

.terminal-title {
  margin-left: 0.6rem;
  color: var(--color-subtle);
  font-size: 0.8em;
}

.terminal-body {
  padding: clamp(1.1rem, 2vw, 1.6rem) clamp(1.1rem, 2vw, 1.75rem);
}

.line {
  margin: 0;
  font-size: inherit;
  animation: reveal 1ms linear calc(var(--step) * 450ms + 250ms) both;
}

.command {
  display: flex;
  gap: 0.75ch;
  color: var(--color-text);
}

.command + .command,
.output + .command {
  margin-top: 0.85rem;
}

.prompt {
  color: var(--color-accent);
}

.typed {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  animation: type 400ms steps(14, end) calc(var(--step) * 450ms + 250ms) both;
}

.output {
  color: var(--color-muted);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1.5ch;
  color: var(--color-cyan);
}

.notes {
  padding: 0;
  list-style: none;
}

.notes li {
  display: flex;
  gap: 1.5ch;
  min-width: 0;
}

.notes time {
  flex: 0 0 auto;
  color: var(--color-subtle);
}

.notes a {
  min-width: 0;
  min-height: 24px;
  overflow: hidden;
  color: var(--color-cyan);
  border: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notes a:hover {
  color: var(--color-accent);
}

.notes:focus-within {
  animation: none;
}

.caret {
  display: inline-block;
  width: 0.6em;
  height: 1.15em;
  align-self: center;
  background: var(--color-text);
  animation: blink 1.1s steps(1, end) infinite;
}

@keyframes reveal {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes type {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .line,
  .typed,
  .caret {
    animation: none;
  }
}
</style>
