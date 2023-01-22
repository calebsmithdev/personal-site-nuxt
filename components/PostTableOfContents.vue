<template>
  <div>
    <h3>Table of Contents</h3>
    <nav class="mt-4">
      <ul class="list-none mb-0 list-outside">
        <li v-for="link in tocItems" :key="link.id" class="toc-list" @click="headingClick(link)">
          <div class="mb-2">
            <a
              :class="{'border-current': link.id === currentItem, 'border-transparent': link.id !== currentItem}"
              role="button"
              :href="`#${link.id}`"
            >{{ link.text }}</a>
          </div>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  post: {
    type: Object,
    default: () => ({})
  },
  postContent: String,
  htmlContext: null
})

const observer = ref(null)
const currentItem = ref(null)
const tocItems = ref([
  {
    text: 'Introduction',
    id: 'introduction'
  }
])

onMounted(() => {
  getHeaders()
  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute('id')
      if (entry.isIntersecting) {
        currentItem.value = id
      }

      const bodyEl = document.getElementsByTagName('body')[0]
      if (bodyEl.getBoundingClientRect().top === 0) {
        currentItem.value = 'introduction'
      }
    })
  }, {
    root: props.htmlContext,
    threshold: 0
  })

  document
    .querySelectorAll('#full-content h2[id]')
    .forEach((section) => {
      observer.value.observe(section)
    })
})

function headingClick (link) {
  currentItem.value = link.id
}

function getHeaders () {
  const parser = new DOMParser()
  const doc = parser.parseFromString(props.post.content, 'text/html')
  const headers = doc.getElementsByTagName('h2')

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]
    if (!header.id) {
      continue
    }
    tocItems.value.push({
      text: header.innerText,
      id: header.id
    })
  }
}
</script>

<style scoped>
  a.border-current {
    border-color: currentColor;
  }
  a.border-transparent {
    border-color: transparent;
  }
</style>
