<template>
  <footer class="">
    <div class="container">
      <div class="flex justify-between py-8">
        <div>
          <p class="mb-1 font-bold">
            &copy; {{ dayjs().format('YYYY') }} Caleb Smith
          </p>
          <p class="text-sm font-light">
            Powered by
            <a href="https://nuxtjs.org/" target="_blank" rel="noreferrer noopener">
              Nuxt.js
            </a>
            and
            <a href="https://wordpress.org/" target="_blank" rel="noreferrer noopener">
              WordPress
            </a>
          </p>
        </div>

        <div class="text-right">
          <p class="mb-1 font-bold">
            Follow me
          </p>
          <p class="text-sm font-light flex items-center">
            <a href="https://github.com/calebsmithdev" target="_blank" rel="noreferrer noopener">
              Github
            </a>
            <span class="mx-2">&#8211;</span>
            <a href="https://www.linkedin.com/in/calebsmithdev/" target="_blank" rel="noreferrer noopener">
              LinkedIn
            </a>
            <span class="mx-2">&#8211;</span>
            <a href="https://twitter.com/CalebSmithDev" target="_blank" rel="noreferrer noopener">
              Twitter
            </a>
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
</script>
