import type { MetadataRoute } from 'next';

const SITE_URL = 'https://neurocomputers.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/dashboard', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/dashboard/spikes', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/dashboard/network', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/dashboard/iq', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/dashboard/discovery', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/dashboard/experiments', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/dashboard/protocols', priority: 0.6, changeFrequency: 'monthly' as const },
    // /dashboard/publish intentionally omitted — hidden from public nav
    //  until the generator is polished; keep it out of search index too.
    { url: '/dashboard/constructor', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/dashboard/live', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/contact', priority: 0.3, changeFrequency: 'yearly' as const },
  ];
  return pages.map((p) => ({
    url: `${SITE_URL}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
