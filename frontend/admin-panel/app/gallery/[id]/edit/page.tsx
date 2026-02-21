'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { galleryApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

const gallerySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  imageUrl: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  category: z.string().optional(),
  displayOrder: z.number().min(0, 'Display order must be at least 0').default(0),
})

type GalleryFormData = z.infer<typeof gallerySchema>

export default function EditGalleryPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
  })

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setIsLoading(true)
        const response = await galleryApi.getById(itemId)
        reset({
          title: response.data.title,
          imageUrl: response.data.imageUrl,
          description: response.data.description || '',
          category: response.data.category || '',
          displayOrder: response.data.displayOrder,
        })
      } catch (err: any) {
        console.error('Failed to fetch gallery item:', err)
        setError(err.message || 'Failed to load gallery item')
      } finally {
        setIsLoading(false)
      }
    }

    if (itemId) {
      fetchItem()
    }
  }, [itemId, reset])

  const onSubmit = async (data: GalleryFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await galleryApi.update(itemId, data)
      router.push('/gallery')
    } catch (err: any) {
      console.error('Failed to update gallery item:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update gallery item')
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Gallery Image</h1>
        <p className="text-gray-600 mt-1">Update gallery item information</p>
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
            placeholder="e.g., Campus Building"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="Image URL"
            type="url"
            placeholder="https://example.com/image.jpg"
            required
            error={errors.imageUrl?.message}
            {...register('imageUrl')}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of the image..."
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <Input
            label="Category"
            placeholder="e.g., Campus, Events, Students"
            error={errors.category?.message}
            {...register('category')}
          />

          <Input
            label="Display Order"
            type="number"
            placeholder="0"
            error={errors.displayOrder?.message}
            {...register('displayOrder', { valueAsNumber: true })}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Update Gallery Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
