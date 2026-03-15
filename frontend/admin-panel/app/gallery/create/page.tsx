'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { galleryApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import FileUpload from '@/components/ui/FileUpload'

const gallerySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  imageUrl: z.string().min(1, 'Image is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  displayOrder: z.number().min(0, 'Display order must be at least 0').default(0),
})

type GalleryFormData = z.infer<typeof gallerySchema>

export default function CreateGalleryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      displayOrder: 0,
    },
  })

  const onSubmit = async (data: GalleryFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await galleryApi.create(data)
      router.push('/gallery')
    } catch (err: any) {
      console.error('Failed to create gallery item:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create gallery item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Gallery Image</h1>
        <p className="text-gray-600 mt-1">Upload a new image to the gallery</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image <span className="text-red-500">*</span>
            </label>
            <FileUpload
              folder="gallery"
              accept="image/*"
              preview={true}
              onUploadSuccess={(fileUrl) => setValue('imageUrl', fileUrl)}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
            )}
            {watch('imageUrl') && (
              <div className="mt-2">
                <img
                  src={watch('imageUrl')}
                  alt={watch('title') || 'Gallery image'}
                  className="max-w-xs rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

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
              Add to Gallery
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
