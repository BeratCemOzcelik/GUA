'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { galleryApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface GalleryItem {
  id: number
  title: string
  description?: string
  imageUrl: string
  category?: string
  displayOrder: number
  createdAt: string
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    itemId: number | null
    itemTitle: string
  }>({
    isOpen: false,
    itemId: null,
    itemTitle: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await galleryApi.getAll()
      setItems(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch gallery items:', err)
      setError(err.message || 'Failed to load gallery items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleDelete = async () => {
    if (!deleteModal.itemId) return

    try {
      setIsDeleting(true)
      await galleryApi.delete(deleteModal.itemId)
      setDeleteModal({ isOpen: false, itemId: null, itemTitle: '' })
      fetchItems()
    } catch (err: any) {
      console.error('Failed to delete gallery item:', err)
      alert(err.message || 'Failed to delete gallery item')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600 mt-1">Manage gallery images</p>
        </div>
        <Link href="/gallery/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Image
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Grid View */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No gallery items found</p>
            <Link href="/gallery/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
              Add your first image
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                  )}
                  {item.category && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mb-3">
                      {item.category}
                    </span>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Order: {item.displayOrder}</span>
                    <div className="flex items-center space-x-2">
                      <Link href={`/gallery/${item.id}/edit`}>
                        <Button variant="secondary" size="sm">
                          ✏️
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            itemId: item.id,
                            itemTitle: item.title,
                          })
                        }
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemId: null, itemTitle: '' })}
        title="Delete Gallery Item"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.itemTitle}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, itemId: null, itemTitle: '' })
              }
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
