'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { blogApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface BlogPost {
  id: number
  title: string
  slug: string
  authorName: string
  isPublished: boolean
  publishedAt?: string
  createdAt: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    postId: number | null
    postTitle: string
  }>({
    isOpen: false,
    postId: null,
    postTitle: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await blogApi.getAll()
      setPosts(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch blog posts:', err)
      setError(err.message || 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDelete = async () => {
    if (!deleteModal.postId) return

    try {
      setIsDeleting(true)
      await blogApi.delete(deleteModal.postId)
      setDeleteModal({ isOpen: false, postId: null, postTitle: '' })
      fetchPosts()
    } catch (err: any) {
      console.error('Failed to delete blog post:', err)
      alert(err.message || 'Failed to delete blog post')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTogglePublish = async (postId: number, isCurrentlyPublished: boolean) => {
    try {
      if (isCurrentlyPublished) {
        await blogApi.unpublish(postId)
      } else {
        await blogApi.publish(postId)
      }
      fetchPosts()
    } catch (err: any) {
      console.error('Failed to toggle publish status:', err)
      alert(err.message || 'Failed to toggle publish status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-600 mt-1">Manage blog posts and articles</p>
        </div>
        <Link href="/blog/create">
          <Button>
            <span className="mr-2">➕</span>
            New Blog Post
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts found</p>
            <Link href="/blog/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
              Create your first blog post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 font-mono">{post.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.authorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          post.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant={post.isPublished ? 'secondary' : 'success'}
                          size="sm"
                          onClick={() => handleTogglePublish(post.id, post.isPublished)}
                        >
                          {post.isPublished ? '📥 Unpublish' : '📤 Publish'}
                        </Button>
                        <Link href={`/blog/${post.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            ✏️ Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              postId: post.id,
                              postTitle: post.title,
                            })
                          }
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, postId: null, postTitle: '' })}
        title="Delete Blog Post"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.postTitle}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, postId: null, postTitle: '' })
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
