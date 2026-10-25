export const defaultDescription = 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.'

export interface SocialImage {
  /** A site-relative path such as `/social/default.png`, or an absolute https URL. */
  src: string
  alt: string
  /** Only set dimensions and type when they are known to match the file. */
  width?: number
  height?: number
  type?: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | 'image/avif'
}

export const defaultSocialImage: SocialImage = {
  src: '/social/default.png',
  alt: 'Caleb Smith: I build dependable software and write down what I learn. Full-stack developer in Kansas. caleb-smith.dev',
  width: 1200,
  height: 630,
  type: 'image/png'
}

const socialImageSource = /^(?:https:\/\/|\/(?!\/))/

export const isSocialImageSource = (src: string) => {
  return socialImageSource.test(src) && URL.canParse(src, 'https://caleb-smith.dev/')
}

/**
 * Builds the social image for an article's optional `image` frontmatter.
 * Override dimensions are unknown, so they are left out rather than guessed.
 */
export const articleSocialImage = (
  article: { title: string, image?: string, imageAlt?: string },
  resolveAsset: (src: string) => string = src => src
): SocialImage | undefined => {
  if (!article.image) { return undefined }

  const src = resolveAsset(article.image)
  if (!isSocialImageSource(src)) { return undefined }

  return { src, alt: article.imageAlt || article.title }
}
