'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { courseMaterialsApi, coursesApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import FileUpload from '@/components/ui/FileUpload'

const courseMaterialSchema = z.object({
  courseId: z.number().min(1, 'Please select a course'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  fileUrl: z.string().min(1, 'Please upload a file'),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  version: z.number().default(1),
  isActive: z.boolean().default(true),
})

type CourseMaterialFormData = z.infer<typeof courseMaterialSchema>

export default function CreateCourseMaterialPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([])
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string
    fileName: string
    fileType: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CourseMaterialFormData>({
    resolver: zodResolver(courseMaterialSchema),
    defaultValues: {
      version: 1,
      isActive: true,
    },
  })

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getAll()
        setCourses(response.data || [])
      } catch (err: any) {
        console.error('Failed to fetch courses:', err)
      }
    }
    fetchCourses()
  }, [])

  const handleFileUploadSuccess = (fileUrl: string, fileName: string) => {
    // Determine file type from file extension
    const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE'

    setUploadedFile({
      fileUrl,
      fileName,
      fileType: extension,
    })

    // Update form fields
    setValue('fileUrl', fileUrl)
    setValue('fileName', fileName)
    setValue('fileType', extension)
  }

  const onSubmit = async (data: CourseMaterialFormData) => {
    if (!uploadedFile) {
      setError('Please upload a file before submitting')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await courseMaterialsApi.create({
        ...data,
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
      })
      router.push('/course-materials')
    } catch (err: any) {
      console.error('Failed to create course material:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create course material')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Course Material</h1>
        <p className="text-gray-600 mt-1">Add a new course material resource</p>
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
          <Select
            label="Course"
            required
            error={errors.courseId?.message}
            options={courses.map((course) => ({
              value: course.id,
              label: course.name,
            }))}
            {...register('courseId', { valueAsNumber: true })}
          />

          <Input
            label="Title"
            placeholder="e.g., Introduction to Calculus - Lecture 1"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of the material..."
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <div>
            <FileUpload
              label="Upload File"
              folder="course-materials"
              maxSizeMB={50}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*,.mp4,.mp3"
              preview={false}
              onUploadSuccess={handleFileUploadSuccess}
              onUploadError={(error) => setError(error)}
            />
            {uploadedFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  File uploaded: <strong>{uploadedFile.fileName}</strong> ({uploadedFile.fileType})
                </p>
              </div>
            )}
            {errors.fileUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.fileUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Version"
              type="number"
              placeholder="e.g., 1"
              required
              error={errors.version?.message}
              {...register('version', { valueAsNumber: true })}
            />

            <div className="flex items-end pb-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
                  {...register('isActive')}
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Active Material
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!uploadedFile}>
              Upload Material
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
