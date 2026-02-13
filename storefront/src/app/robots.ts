import { MetadataRoute } from 'next';

/**
 * robots.txt configuration for search engine crawlers
 * Controls which pages should be indexed and which should be excluded
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kvastram.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/checkout/',
          '/account',
          '/account/',
          '/api/',
          '/_next/',
          '/404',
        ],
      },
      {
        // Googlebot specific rules
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/checkout', '/account'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
