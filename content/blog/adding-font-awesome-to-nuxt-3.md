---
title: 'Adding Font Awesome to Nuxt 3'
description: "Installing Font Awesome with Nuxt 3 is easy, but there a few gotchas that you may not be aware of."
# image: /assets/blog/v3-3.png
date: 2022-10-08
# last_updated: 2024-01-19
categories: ['Nuxt 3']
---

Are you on the bleeding edge path of Nuxt and eager to use Font Awesome with Nuxt 3? Font Awesome has done a great job documenting the installation, but there a few missing steps you might run into with the latest version. You can find those instructions on the Font Awesome website, in case they change in the future.

## Package Installation

First, let's get the packages installed and ready to go. Go ahead and run the following command based on your package manager:

```bash
# For NPM users
npm install @fortawesome/fontawesome-free @fortawesome/fontawesome-svg-core @fortawesome/free-brands-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/free-solid-svg-icons @fortawesome/vue-fontawesome --save

# For Yarn users
yarn add @fortawesome/fontawesome-free @fortawesome/fontawesome-svg-core @fortawesome/free-brands-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/free-solid-svg-icons @fortawesome/vue-fontawesome
```

This will install the free Font Awesome packages you could need, but feel free to limit those as needed.

## Plugin Installation

Next, let's setup the plugin in the Nuxt project. Create a file in your plugins folder `/plugins/font-awesome.ts`. The following code is what I use on this site, but you can add as many icons (or package of icons) as you need.

```js [/plugins/font-awesome.ts]
import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons'

config.autoAddCss = false
library.add(faGithub, faLinkedin, faTwitter)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon, {})
})
```

## Nuxt Config Changes

Last, we need to add some code to the `nuxt.config.ts` file.

```js [nuxt.config.ts]
export default defineNuxtConfig({
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],
  build: {
    transpile: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/vue-fontawesome'
    ]
  }
})
```

If you decided to use less of the free packages (or add pro packages), be sure to change that transpile list accordingly. The CSS can be left as-is no matter what.

## Conclusion

That's it! You can now use Font Awesome anywhere using the Vue components, like `<font-awesome-icon icon="fa-brands fa-github" />`. 