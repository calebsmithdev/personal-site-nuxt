import { v4 } from 'uuid'

export default defineNuxtPlugin((nuxtApp) => {
  const clapperId = useCookie('clapper-id')
  if (!clapperId.value) {
    clapperId.value = v4()
  }
})
