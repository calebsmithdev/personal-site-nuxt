<template>
  <footer class="global-footer">
    <div class="site-shell footer-inner">
      <div>
        <p class="footer-brand">
          Caleb Smith
        </p>
        <p class="footer-description">
          Full-stack developer in Kansas.
        </p>
        <p class="copyright">
          &copy; {{ dayjs().format('YYYY') }} Caleb Smith
        </p>
      </div>

      <nav aria-label="Footer navigation">
        <ul class="footer-links">
          <li>
            <a href="https://github.com/calebsmithdev" target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/calebsmithdev/" target="_blank" rel="noreferrer noopener">
              LinkedIn
            </a>
          </li>
          <li>
            <NuxtLink to="/blog">
              Writing
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
</script>

<style scoped>
.global-footer {
  border-top: 2px solid var(--color-accent);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  min-height: 15rem;
  padding-top: 3.5rem;
  padding-bottom: 3.5rem;
}

.footer-brand {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.8rem;
  letter-spacing: 0.05em;
}

.footer-description {
  margin: 0.65rem 0 0;
  color: var(--color-text);
  font-size: 1.15rem;
}

.copyright {
  margin: 1.9rem 0 0;
  color: var(--color-subtle);
  font-family: var(--font-heading);
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: clamp(2rem, 5vw, 5rem);
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-links a {
  color: var(--color-cyan);
  border-bottom: 0;
  font-family: var(--font-heading);
  font-size: 1rem;
}

.footer-links li:last-child a {
  color: var(--color-accent);
}

.footer-links a:hover {
  border-bottom: 1px solid currentColor;
}

@media (max-width: 767px) {
  .footer-inner {
    align-items: flex-start;
    flex-direction: column;
    gap: 2.5rem;
    min-height: 0;
  }

  .footer-links {
    flex-wrap: wrap;
    gap: 1.5rem 2rem;
  }
}
</style>
