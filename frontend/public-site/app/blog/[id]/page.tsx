'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { blogApi, getFileUrl } from '@/lib/api'

export default function BlogDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      try {
        const res = await blogApi.getBySlug(id)
        setPost(res.data)
      } catch {
        const res = await blogApi.getAll()
        const found = (res.data || []).find((p: any) => p.id.toString() === id)
        setPost(found)
      }
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Blog post not found</h1>
          <Link href="/blog" className="text-primary mt-4 inline-block hover:underline">Back to Blog</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <Link href="/blog" className="text-gold/80 text-sm mb-4 inline-flex items-center gap-1 hover:text-gold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            {post.author && <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {post.author}
            </span>}
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {post.category && <span className="px-2.5 py-1 bg-gold text-navy rounded text-xs font-semibold">{post.category}</span>}
          </div>
        </div>
      </section>

      <article className="py-16 max-w-4xl mx-auto px-4">
        {post.featuredImageUrl && (
          <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
            <img src={getFileUrl(post.featuredImageUrl)} alt={post.title} className="w-full h-auto" />
          </div>
        )}
        <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-lg">
          {post.content}
        </div>
      </article>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
