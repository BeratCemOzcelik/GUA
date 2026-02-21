'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { blogApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

const blogSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  featuredImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
})

type BlogFormData = z.infer<typeof blogSchema>

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const postId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
  })

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true)
        const response = await blogApi.getById(postId)
        reset({
          title: response.data.title,
          slug: response.data.slug,
          content: response.data.content,
          featuredImageUrl: response.data.featuredImageUrl || '',
          isPublished: response.data.isPublished,
        })
      } catch (err: any) {
        console.error('Failed to fetch blog post:', err)
        setError(err.message || 'Failed to load blog post')
      } finally {
        setIsLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId, reset])

  const title = watch('title')
  const generateSlug = () => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    setValue('slug', slug)
  }

  const onSubmit = async (data: BlogFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await blogApi.update(postId, data)
      router.push('/blog')
    } catch (err: any) {
      console.error('Failed to update blog post:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update blog post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
        <p className="text-gray-600 mt-1">Update blog post content</p>
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

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Title"
            placeholder="e.g., Welcome to Global University America"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Input
                label="Slug (URL)"
                placeholder="e.g., welcome-to-gua"
                required
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>
            <Button type="button" variant="secondary" onClick={generateSlug}>
              Generate
            </Button>
          </div>

          <Input
            label="Featured Image URL"
            type="url"
            placeholder="https://example.com/image.jpg"
            error={errors.featuredImageUrl?.message}
            {...register('featuredImageUrl')}
          />

          <Textarea
            label="Content"
            placeholder="Write your blog post content here... (Markdown supported)"
            rows={15}
            required
            error={errors.content?.message}
            {...register('content')}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
              {...register('isPublished')}
            />
            <label htmlFor="isPublished" className="ml-2 text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Update Blog Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
