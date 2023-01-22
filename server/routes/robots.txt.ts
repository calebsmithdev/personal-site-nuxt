import axios from 'axios'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const { data } = await axios.get(config.public.wordpressBaseUrl + '/robots.txt', {
    responseType: 'blob'
  })
  event.res.setHeader('content-type', 'text/plain')
  event.res.end(data)
})
