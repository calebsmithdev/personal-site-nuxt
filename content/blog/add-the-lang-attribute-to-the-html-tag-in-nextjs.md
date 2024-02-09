---
title: 'Add the lang attribute to the HTML tag in NextJS'
description: "One of the most common accessibility and HTML validation warnings are the missing lang tag on the HTML tag. Let's explore fixing that using NextJS."
# image: /assets/blog/v3-3.png
date: 2022-09-18
# last_updated: 2024-01-19
categories: ['NextJS']
---

One of the most common accessibility and HTML validation warnings are the missing lang tag on the HTML tag. This tag is used to tell the user which language the page is written in and can help the browser better detect automatic translation. Here is an example of what that tag looks like:

```html
<!-- English Content -->
<html lang="en"></html>
```

You can find the [full list of ISO 639-1 Language Codes](https://www.w3schools.com/tags/ref_language_codes.asp) on W3Schools.

Note: The lang attribute does not have any affect on SEO as indicated by Google in this [Webmaster Hangout video](https://www.youtube.com/watch?v=isW-Ke-AJJU&t=3354s).

## The NextJS Code

Unlike other platforms/frameworks, NextJS has a special configuration for automatically changing out the translation code via the i18n object in the `next.config.js` file. See an example of the code snippet below:

```js [next.config.js]
module.exports = {
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
  },
};
```

If your website supports multiple locales, then you can add them to the locales array. If your site only supports one locale, then just one value in the array is acceptable. The `defaultLocale` is a required property and should use your default locale. For an English based website, this would be en.

## The Next Level

Does your site support multiple locales? You can take your project to the next level by exploring the NextJS document on [Internationalization Routing](https://nextjs.org/docs/advanced-features/i18n-routing). NextJS supports both domain/sub-domain routing and path-based routing - the benefits of either will depend on your business objectives and SEO strategy. You can find a [great article on the SEOBlog](https://www.seoblog.com/subfolders-subdomains-multilingual/#:~:text=Subfolders%2C%20Subdomains%2C%20What%E2%80%99s%20the%20Difference%3F) that walks through the process in more detail.

One of the great benefits of NextJS is automatically handling locale detection and redirecting people to the correct locale. In the event you want to disable this, be sure to use the code snippet below:

```js [next.config.js]
module.exports = {
  i18n: {
    localeDetection: false,
  },
}
```