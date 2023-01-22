<template>
  <header class="">
    <div class="container">
      <div class="flex justify-between py-8">
        <NuxtLink to="/" class="logo">
          <div class="flex items-center">
            <div class="rounded-full overflow-hidden h-12 w-12">
              <img src="~/assets/img/profile-image.jpg" alt="A profile picture of Caleb Smith">
            </div>
            <div class="logo-text">
              Caleb Smith
            </div>
          </div>
        </NuxtLink>

        <nav class="flex items-center">
          <div class="menu-item">
            <NuxtLink to="/">
              Home
            </NuxtLink>
          </div>
          <!-- <div class="menu-item">
            <NuxtLink to="/about">
              About
            </NuxtLink>
          </div> -->
          <div class="menu-item">
            <NuxtLink to="/blog">
              Blog
            </NuxtLink>
          </div>
          <!-- <div class="menu-item">
            <NuxtLink to="/contact">
              Contact
            </NuxtLink>
          </div> -->
        </nav>

        <div class="flex items-center">
          <a href="https://github.com/calebsmithdev" target="_blank" rel="noreferrer" class="social-icon" aria-label="Follow me on Github">
            <font-awesome-icon icon="fa-brands fa-github" />
          </a>
          <a href="https://www.linkedin.com/in/calebsmithdev/" target="_blank" rel="noreferrer" class="social-icon" aria-label="Connect with me on LinkedIn">
            <font-awesome-icon icon="fa-brands fa-linkedin" />
          </a>
          <a href="https://twitter.com/CalebSmithDev" target="_blank" rel="noreferrer" class="social-icon" aria-label="Follow me on Twitter">
            <font-awesome-icon icon="fa-brands fa-twitter" />
          </a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
//
</script>

<style scoped>
  .social-icon {
    @apply text-xl mx-2 border-b-0;
  }

  .menu-item {
    @apply px-2;
  }

  .menu-item > a {
    @apply px-2 py-1 text-lg transition duration-500 ease-in-out border-b-2 border-transparent;
  }

  .menu-item > a:hover,
  .menu-item > a.router-link-active {
    @apply no-underline border-slate-100 text-slate-100;
  }

  .logo-text {
    @apply pl-3 text-2xl font-semibold;
  }

  .logo {
    border-bottom-width: 0;
  }
</style>
