import type { MetadataRoute } from 'next'

// Student portal is auth-gated — do not index in search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  }
}
