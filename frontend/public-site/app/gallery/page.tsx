'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { galleryApi, getFileUrl } from '@/lib/api'

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await galleryApi.getAll()
      const data = res.data || []
      setItems(data)
      setFilteredItems(data)
      const cats = [...new Set(data.map((item: any) => item.category).filter(Boolean))] as string[]
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterByCategory = (cat: string | null) => {
    setSelectedCategory(cat)
    if (cat === null) {
      setFilteredItems(items)
    } else {
      setFilteredItems(items.filter(i => i.category === cat))
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Campus Life</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Gallery</h1>
          <p className="text-lg text-gray-200">Explore our campus life and events</p>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4">
        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => filterByCategory(null)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === null ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => filterByCategory(cat)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-gray-600 text-lg">No gallery items available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="cursor-pointer rounded-xl overflow-hidden card-hover border border-gray-100 group"
              >
                {item.imageUrl ? (
                  <div className="relative">
                    <img src={getFileUrl(item.imageUrl)} alt={item.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-primary to-navy flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                  {item.category && <p className="text-xs text-gray-500 mt-1">{item.category}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="max-w-6xl w-full" onClick={e => e.stopPropagation()}>
            {selectedImage.imageUrl ? (
              <img src={getFileUrl(selectedImage.imageUrl)} alt={selectedImage.title} className="w-full max-h-[90vh] object-contain rounded-lg" />
            ) : (
              <div className="w-full h-64 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-20 h-20 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-white">{selectedImage.title}</h3>
              {selectedImage.description && <p className="text-gray-300 mt-2">{selectedImage.description}</p>}
            </div>
          </div>
        </div>
      )}

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
