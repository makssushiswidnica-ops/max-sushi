import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maks-sushi.pl';
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/pl`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          pl: `${baseUrl}/pl`,
          uk: `${baseUrl}/uk`,
        },
      },
    },
    {
      url: `${baseUrl}/uk`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          pl: `${baseUrl}/pl`,
          uk: `${baseUrl}/uk`,
        },
      },
    },
    {
      url: `${baseUrl}/pl/regulamin`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: {
        languages: {
          pl: `${baseUrl}/pl/regulamin`,
          uk: `${baseUrl}/uk/regulamin`,
        },
      },
    },
    {
      url: `${baseUrl}/pl/polityka-prywatnosci`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: {
        languages: {
          pl: `${baseUrl}/pl/polityka-prywatnosci`,
          uk: `${baseUrl}/uk/polityka-prywatnosci`,
        },
      },
    },
    {
      url: `${baseUrl}/pl/polityka-cookies`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: {
        languages: {
          pl: `${baseUrl}/pl/polityka-cookies`,
          uk: `${baseUrl}/uk/polityka-cookies`,
        },
      },
    },
  ];
}

