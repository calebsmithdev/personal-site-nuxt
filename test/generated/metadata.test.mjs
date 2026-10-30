import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { after, test } from 'node:test'
import { Window } from 'happy-dom'

const window = new Window({
  settings: {
    disableCSSFileLoading: true,
    disableJavaScriptFileLoading: true,
    disableJavaScriptEvaluation: true,
    disableIframePageLoading: true
  }
})
after(() => window.happyDOM.close())
const output = new URL('../../.output/public/', import.meta.url)
// Parse only metadata so modulepreload links and page embeds cannot initiate resource requests.
const readPage = async (path) => {
  const html = await readFile(new URL(path, output), 'utf8')
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]
  assert.ok(head)
  const metadata = head.match(/<title>[^<]*<\/title>|<meta\b[^>]*>|<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi)
  return new window.DOMParser().parseFromString(metadata.join(''), 'text/html')
}

test('homepage has the absolute title, description, and Person metadata', async () => {
  const document = await readPage('index.html')
  assert.equal(document.title, 'Caleb Smith | Full-Stack Developer in Kansas')
  const description = 'Caleb Smith is a full-stack developer in Kansas. Field notes on Vue, Nuxt, TypeScript and Laravel apps, and on Kubernetes and self-hosted infrastructure.'
  assert.equal(document.querySelector('meta[name="description"]').content, description)
  const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph']
  const person = graph.find(node => node['@type'] === 'Person')
  assert.equal(person.jobTitle, 'Full-Stack Developer')
  assert.equal(person.name, 'Caleb Smith')
  assert.equal(person.description, 'Full-stack developer in Kansas building web apps with Vue, Nuxt, TypeScript and Laravel, and the infrastructure that runs them.')
  assert.equal(person.homeLocation['@type'], 'Place')
  assert.deepEqual(person.homeLocation.address, { '@type': 'PostalAddress', addressRegion: 'KS', addressCountry: 'US' })
  assert.deepEqual(person.knowsAbout, ['Vue.js', 'Nuxt', 'TypeScript', 'Laravel', 'PHP', 'Kubernetes', 'Proxmox', 'Ceph', 'Self-hosting'])
  assert.deepEqual(person.sameAs, [
    'https://github.com/calebsmithdev',
    'https://www.linkedin.com/in/calebsmithdev/',
    'https://x.com/CalebSmithDev',
    'https://bsky.app/profile/did:plc:m2blbfmeq3jyk4jiilzygri7'
  ])
  if (person.image) {
    const image = new URL(person.image)
    assert.equal(image.origin, 'https://caleb-smith.dev')
    assert.ok((await stat(new URL(image.pathname.slice(1), output))).isFile())
  }
  assert.equal(graph.find(node => node['@type'] === 'WebSite').description, description)
})

test('blog index describes both content pillars', async () => {
  const document = await readPage('blog/index.html')
  assert.equal(document.querySelector('meta[name="description"]').content, 'Practical field notes from Caleb Smith on building web apps with Vue, Nuxt, TypeScript and Laravel, and on running Kubernetes and self-hosted infrastructure.')
})
