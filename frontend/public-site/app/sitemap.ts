import type { MetadataRoute } from 'next'

const SITE_URL = 'https://gua.edu.pl'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://5.161.76.63:5000/api'

// Refresh sitemap every hour (ISR). Google re-fetches periodically anyway,
// but this keeps new blog posts / programs discoverable quickly after publish.
export const revalidate = 3600

type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly'

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? json) as T
  } catch {
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // --- Static pages ---
  const staticPages: Array<{ path: string; changeFrequency: Freq; priority: number }> = [
    { path: '',                 changeFrequency: 'daily',   priority: 1.0 },
    { path: '/about',           changeFrequency: 'monthly', priority: 0.9 },
    { path: '/programs',        changeFrequency: 'weekly',  priority: 0.9 },
    { path: '/departments',     changeFrequency: 'weekly',  priority: 0.8 },
    { path: '/faculty',         changeFrequency: 'weekly',  priority: 0.7 },
    { path: '/blog',            changeFrequency: 'daily',   priority: 0.7 },
    { path: '/gallery',         changeFrequency: 'monthly', priority: 0.5 },
    { path: '/apply',           changeFrequency: 'monthly', priority: 0.9 },
    { path: '/contact',         changeFrequency: 'yearly',  priority: 0.6 },
    { path: '/diploma-inquiry', changeFrequency: 'yearly',  priority: 0.5 },
    { path: '/privacy',         changeFrequency: 'yearly',  priority: 0.3 },
    { path: '/terms',           changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  // --- Dynamic pages (fail-soft: if API is down the static pages still ship) ---
  const [blogPosts, programs, departments, faculty] = await Promise.all([
    fetchJson<any[]>('/BlogPosts'),
    fetchJson<any[]>('/Programs'),
    fetchJson<any[]>('/Departments'),
    fetchJson<any[]>('/FacultyProfiles'),
  ])

  const blogEntries: MetadataRoute.Sitemap = (blogPosts || [])
    .filter((p: any) => p?.isPublished !== false)
    .map((p: any) => ({
      url: `${SITE_URL}/blog/${p.slug || p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : (p.publishedAt ? new Date(p.publishedAt) : now),
      changeFrequency: 'monthly' as Freq,
      priority: 0.6,
    }))

  const programEntries: MetadataRoute.Sitemap = (programs || [])
    .filter((p: any) => p?.isActive !== false)
    .map((p: any) => ({
      url: `${SITE_URL}/programs/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'monthly' as Freq,
      priority: 0.8,
    }))

  const departmentEntries: MetadataRoute.Sitemap = (departments || [])
    .filter((d: any) => d?.isActive !== false)
    .map((d: any) => ({
      url: `${SITE_URL}/departments/${d.id}`,
      lastModified: d.updatedAt ? new Date(d.updatedAt) : now,
      changeFrequency: 'monthly' as Freq,
      priority: 0.7,
    }))

  const facultyEntries: MetadataRoute.Sitemap = (faculty || [])
    .filter((f: any) => f?.isActive !== false)
    .map((f: any) => ({
      url: `${SITE_URL}/faculty/${f.id}`,
      lastModified: f.updatedAt ? new Date(f.updatedAt) : now,
      changeFrequency: 'yearly' as Freq,
      priority: 0.5,
    }))

  return [
    ...staticEntries,
    ...blogEntries,
    ...programEntries,
    ...departmentEntries,
    ...facultyEntries,
  ]
}
