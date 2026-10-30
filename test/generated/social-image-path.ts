import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const socialImageOutputPath = (image: string, outputDirectory: URL) =>
  join(fileURLToPath(outputDirectory), decodeURIComponent(new URL(image, 'https://example.test').pathname).slice(1))
