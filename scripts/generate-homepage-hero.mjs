import { mkdir, stat } from 'node:fs/promises'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const source = fileURLToPath(new URL('../app/assets/img/homepage-homelab-v1.png', import.meta.url))
const outputDirectory = fileURLToPath(new URL('../public/images/homepage-homelab/', import.meta.url))
const widths = [640, 1024, 1536]
const formats = [
  {
    extension: 'avif',
    encode: image => image.avif({ quality: 50 }),
  },
  {
    extension: 'webp',
    encode: image => image.webp({ quality: 76 }),
  },
  {
    extension: 'jpg',
    encode: image => image.jpeg({ quality: 78, progressive: true }),
  },
]

const sourceMetadata = await sharp(source).metadata()

if (sourceMetadata.width !== 1536 || sourceMetadata.height !== 1024) {
  throw new Error(
    `Expected the canonical hero to be 1536x1024, received ${sourceMetadata.width}x${sourceMetadata.height}`,
  )
}

await mkdir(outputDirectory, { recursive: true })

for (const width of widths) {
  for (const format of formats) {
    const output = `${outputDirectory}/hero-${width}.${format.extension}`
    const image = sharp(source)
      .autoOrient()
      .resize({ width, withoutEnlargement: true })

    await format.encode(image).toFile(output)

    const outputStat = await stat(output)
    console.log(`${relative(process.cwd(), output)} ${outputStat.size} bytes`)
  }
}
