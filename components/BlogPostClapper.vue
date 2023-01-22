<template>
  <div class="flex items-center">
    <button id="clap" ref="clapEl" class="clap" @click="clapped">
      <span style="display: flex; justify-content: center;">
        <svg id="clap--icon" xmlns="http://www.w3.org/2000/svg" viewBox="-549 338 100.1 125">
          <path d="M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z" />
          <path d="M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9" />
        </svg>
      </span>
    </button>
    <p class="ml-4 mb-0">
      {{ visualClaps }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/shared'
import useClaps from '~~/api/posts/claps.api'

const props = defineProps({
  post: {
    type: Object,
    default: () => ({})
  }
})

const { claps, refresh, addClap } = await useClaps()
const clapperId = useCookie('clapper-id')

const visualClaps = ref(claps)
const amountClapped = ref(0)
const totalTimesUserClapped = ref(0)
const clapEl = ref(null)

watch(() => claps, (val, oldVal) => {
  visualClaps.value = val
})

onMounted(() => {
  const timesClappedLS = localStorage.getItem('clapped-post-' + props.post.databaseId)
  totalTimesUserClapped.value = parseInt(timesClappedLS) || 0
})

const debouncedClapped = useDebounceFn(async () => {
  await addClap(amountClapped.value, props.post.databaseId, clapperId.value)
  amountClapped.value = 0
  refresh()
}, 400, { maxWait: 5000 })

const clapped = () => {
  // Get the latest value in case the user has multiple tabs open
  const timesClappedLS = localStorage.getItem('clapped-post-' + props.post.databaseId)
  totalTimesUserClapped.value = parseInt(timesClappedLS) || 0
  if (totalTimesUserClapped.value >= 10) {
    return
  }
  amountClapped.value += 1
  visualClaps.value += 1
  totalTimesUserClapped.value += 1
  localStorage.setItem('clapped-post-' + props.post.databaseId, totalTimesUserClapped.value.toString())
  debouncedClapped()
}
</script>

<style scoped>
.clap {
  position: relative;
  outline: 1px solid transparent;
  border-radius: 50%;
  border: 1px solid rgba(189,195,199 ,1);
  width: 60px;
  height: 60px;
  background: none;
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    border-radius: 50%;
    //border: 1px solid rgba(189,195,199 ,1);
    width: 60px - 1px;
    height: 60px - 1px;
  }
  &:hover {
   cursor: pointer;
   border: 1px solid rgb(20 202 134);
   transition: border-color 0.3s ease-in;
    &:after {
      animation: shockwave 1s ease-in infinite;
    }
  }
  svg {
    width: 35px;
    fill: none;
    stroke: rgb(20 202 134);
    stroke-width: 2px;
    &.checked {
      fill: rgb(20 202 134);
      stroke: #fff;
      stroke-width: 1px;
    }
  }
}

@keyframes shockwave {
  0% {
    transform: scale(1);
    box-shadow: 0 0 2px $secondary-color;
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 0;
    box-shadow: 0 0 50px darken($secondary-color, 20%), inset 0 0 10px $secondary-color;
  }
}
</style>
