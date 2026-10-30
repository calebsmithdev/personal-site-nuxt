// Renders scripts/social-image/default.html to public/social/default.png at
// 1200x630 with headless Chrome. Set CHROME_PATH to a Chrome or Chromium binary.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const template = join(root, 'scripts/social-image/default.html')
const output = join(root, 'public/social/default.png')

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

mkdirSync(join(root, 'public/social'), { recursive: true })
execFileSync(chrome, [
  '--headless',
  // The page is a local template with no network access.
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--default-background-color=061426ff',
  '--virtual-time-budget=5000',
  '--window-size=1200,630',
  `--screenshot=${output}`,
  `file://${template}`
], { stdio: 'inherit' })

console.log(`Wrote ${output}`)
