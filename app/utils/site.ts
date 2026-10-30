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
 * The card `npm run social-image` renders for an article: the article path
 * under /social, so /blog/nuxt/routing uses /social/blog/nuxt/routing.png.
 */
export const articleCardSocialImage = (
  article: { path: string, title: string, imageAlt?: string }
): SocialImage => ({
  src: `/social${article.path.replace(/\/+$/, '')}.png`,
  alt: article.imageAlt || `Social card for “${article.title}”, a field note by Caleb Smith.`,
  width: 1200,
  height: 630,
  type: 'image/png'
})

/**
 * Builds the social image for an article. An `image` frontmatter override wins;
 * its dimensions are unknown, so they are left out rather than guessed.
 * Otherwise, or when the override isn't a usable URL, the article's card is used.
 */
export const articleSocialImage = (
  article: { path: string, title: string, image?: string, imageAlt?: string },
  resolveAsset: (src: string) => string = src => src
): SocialImage => {
  if (!article.image) { return articleCardSocialImage(article) }

  const src = resolveAsset(article.image)
  // imageAlt describes the override, so it doesn't fit the generated card.
  if (!isSocialImageSource(src)) { return articleCardSocialImage({ path: article.path, title: article.title }) }

  return { src, alt: article.imageAlt || article.title }
}
