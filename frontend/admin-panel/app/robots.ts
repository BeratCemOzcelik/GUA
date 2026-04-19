import type { MetadataRoute } from 'next'

// Admin panel is auth-gated and private — do not index in search engines.
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
