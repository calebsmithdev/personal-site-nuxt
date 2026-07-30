<template>
  <header class="global-header">
    <div class="site-shell header-inner">
      <NuxtLink to="/" class="brand" aria-label="Caleb Smith home">
        Caleb Smith
      </NuxtLink>

      <nav aria-label="Primary navigation">
        <ul class="nav-list">
          <li>
            <NuxtLink to="/" class="nav-link">
              Home
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/blog" class="nav-link">
              Writing
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.global-header {
  position: relative;
  z-index: 10;
  border-bottom: 1px solid var(--color-rule);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 5rem;
}

.brand {
  color: var(--color-text);
  border: 0;
  font-family: var(--font-heading);
  font-size: clamp(1.3rem, 2vw, 1.75rem);
  font-weight: 500;
  letter-spacing: 0.075em;
}

.nav-list {
  display: flex;
  align-items: stretch;
  gap: clamp(1.5rem, 3vw, 3rem);
  min-height: 5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav-list li {
  display: flex;
}

.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  color: var(--color-text);
  border: 0;
  font-family: var(--font-heading);
  font-size: 0.95rem;
}

.nav-link::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 3px;
  content: '';
  background: transparent;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--color-accent);
}

.nav-link.router-link-active::after {
  background: var(--color-accent);
}

@media (max-width: 480px) {
  .header-inner,
  .nav-list {
    min-height: 4.5rem;
  }

  .brand {
    font-size: 1.1rem;
    letter-spacing: 0.04em;
  }

  .nav-list {
    gap: 1rem;
  }

  .nav-link {
    font-size: 0.85rem;
  }
}
</style>
