// Renders the social cards with headless Chrome at 1200x630:
// - scripts/social-image/default.html to public/social/default.png
// - scripts/social-image/post.html to public/social/blog/<slug>.png for every
//   content/blog/<slug>.md, where <slug> may be nested (nuxt/routing).
// Pass `default` or `posts` to render only one kind. Set CHROME_PATH to a
// Chrome or Chromium binary.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { displayCategory, parsePostFrontmatter, validatePostPath } from './social-image/frontmatter.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const contentDirectory = join(root, 'content/blog')
const postOutputDirectory = join(root, 'public/social/blog')

const findPlaywrightChromium = () => {
  const cache = join(homedir(), '.cache/ms-playwright')
  if (!existsSync(cache)) { return undefined }

  return readdirSync(cache)
    .filter(name => /^chromium-\d+$/.test(name))
    .sort()
    .reverse()
    .map(name => join(cache, name, 'chrome-linux64/chrome'))
    .find(path => existsSync(path))
}

const chrome = process.env.CHROME_PATH || findPlaywrightChromium()
if (!chrome) {
  console.error('Set CHROME_PATH to a Chrome or Chromium binary.')
  process.exit(1)
}

const chromeArgs = [
  '--headless',
  // The page is a local template with no network access.
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--default-background-color=061426ff',
  '--virtual-time-budget=5000',
  '--window-size=1200,630'
]

const screenshot = (url: URL, output: string) => {
  mkdirSync(dirname(output), { recursive: true })
  execFileSync(chrome, [...chromeArgs, `--screenshot=${output}`, url.href], { stdio: ['ignore', 'ignore', 'inherit'] })
  console.log(`Wrote ${output}`)
}

const dumpDom = (url: URL) => {
  return execFileSync(chrome, [...chromeArgs, '--dump-dom', url.href], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
}

const readPost = (file: string) => {
  validatePostPath(file)
  const { title, categories } = parsePostFrontmatter(readFileSync(join(contentDirectory, file), 'utf8'), file)
  return { slug: file.slice(0, -3), title, categories: categories.map(displayCategory) }
}

const renderDefault = () => {
  screenshot(pathToFileURL(join(root, 'scripts/social-image/default.html')), join(root, 'public/social/default.png'))
}

const renderPosts = () => {
  const posts = readdirSync(contentDirectory, { recursive: true, encoding: 'utf8' })
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(readPost)

  for (const post of posts) {
    const url = pathToFileURL(join(root, 'scripts/social-image/post.html'))
    url.searchParams.set('title', post.title)
    for (const category of post.categories) {
      url.searchParams.append('category', category)
    }

    const body = dumpDom(url).match(/<body\b[^>]*>/)?.[0] ?? ''
    const fit = body.match(/\bdata-fit="(\w+)"/)?.[1] ?? 'not measured'
    const fontSize = body.match(/\bdata-font-size="(\d+)"/)?.[1] ?? '?'
    const lines = body.match(/\bdata-lines="(\d+)"/)?.[1] ?? '?'
    if (fit !== 'ok') {
      throw new Error(`The title of ${post.slug} doesn't fit its card (${fit}). Shorten it or adjust post.html.`)
    }

    console.log(`${post.slug}: ${fontSize}px, ${lines} lines`)
    screenshot(url, join(postOutputDirectory, `${post.slug}.png`))
  }
}

const mode = process.argv[2]
if (mode && mode !== 'default' && mode !== 'posts') {
  console.error('Usage: node scripts/generate-social-image.ts [default|posts]')
  process.exit(1)
}

if (mode !== 'posts') { renderDefault() }
if (mode !== 'default') { renderPosts() }
