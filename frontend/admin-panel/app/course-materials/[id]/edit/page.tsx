'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  courseOfferingId: z.number().nullable().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  fileUrl: z.string().min(1, 'File URL is required'),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  version: z.number().default(1),
  isActive: z.boolean().default(true),
})

type CourseMaterialFormData = z.infer<typeof courseMaterialSchema>

interface CourseMaterial {
  id: number
  courseId: number
  courseOfferingId?: number | null
  courseName: string
  title: string
  description?: string
  fileUrl: string
  fileName: string
  fileType: string
  uploadedBy: string
  version: number
  isActive: boolean
  createdAt: string
}

export default function EditCourseMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([])
  const [courseOfferings, setCourseOfferings] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [currentMaterial, setCurrentMaterial] = useState<CourseMaterial | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string
    fileName: string
    fileType: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CourseMaterialFormData>({
    resolver: zodResolver(courseMaterialSchema),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [materialResponse, coursesResponse] = await Promise.all([
          courseMaterialsApi.getById(materialId),
          coursesApi.getAll(),
        ])

        const material = materialResponse.data
        setCurrentMaterial(material)
        setCourses(coursesResponse.data || [])
        setSelectedCourseId(material.courseId)

        // Fetch course offerings if courseId exists
        if (material.courseId) {
          try {
            const offeringsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courseofferings?courseId=${material.courseId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            })
            const offeringsResult = await offeringsResponse.json()
            setCourseOfferings(offeringsResult.data || [])
          } catch (err) {
            console.error('Failed to fetch course offerings:', err)
          }
        }

        // Set initial file data
        setUploadedFile({
          fileUrl: material.fileUrl,
          fileName: material.fileName,
          fileType: material.fileType,
        })

        reset({
          courseId: material.courseId,
          courseOfferingId: material.courseOfferingId || null,
          title: material.title,
          description: material.description || '',
          fileUrl: material.fileUrl,
          fileName: material.fileName,
          fileType: material.fileType,
          version: material.version,
          isActive: material.isActive,
        })
      } catch (err: any) {
        console.error('Failed to fetch course material:', err)
        setError(err.message || 'Failed to load course material')
      } finally {
        setIsLoading(false)
      }
    }

    if (materialId) {
      fetchData()
    }
  }, [materialId, reset, setValue])

  useEffect(() => {
    const fetchCourseOfferings = async () => {
      if (!selectedCourseId) {
        setCourseOfferings([])
        return
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courseofferings?courseId=${selectedCourseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const result = await response.json()
        setCourseOfferings(result.data || [])
      } catch (err: any) {
        console.error('Failed to fetch course offerings:', err)
        setCourseOfferings([])
      }
    }
    fetchCourseOfferings()
  }, [selectedCourseId])

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
      await courseMaterialsApi.update(materialId, {
        ...data,
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
      })
      router.push('/course-materials')
    } catch (err: any) {
      console.error('Failed to update course material:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update course material')
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Course Material</h1>
        <p className="text-gray-600 mt-1">Update course material information</p>
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
            {...register('courseId', {
              valueAsNumber: true,
              onChange: (e) => {
                const courseId = parseInt(e.target.value)
                setSelectedCourseId(courseId || null)
                setValue('courseOfferingId', null)
              }
            })}
          />

          {selectedCourseId && (
            <Select
              label="Course Offering (Optional)"
              error={errors.courseOfferingId?.message}
              options={courseOfferings.map((offering: any) => ({
                value: offering.id,
                label: `${offering.section} - ${offering.termName} (${offering.facultyName || 'No Faculty'})`,
              }))}
              {...register('courseOfferingId', { valueAsNumber: true })}
            />
          )}

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update File (Optional)
            </label>
            {uploadedFile && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Current file: <strong>{uploadedFile.fileName}</strong> ({uploadedFile.fileType})
                </p>
              </div>
            )}
            <FileUpload
              label="Replace File"
              folder="course-materials"
              maxSizeMB={50}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*,.mp4,.mp3"
              preview={false}
              onUploadSuccess={handleFileUploadSuccess}
              onUploadError={(error) => setError(error)}
            />
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
            <Button type="submit" isLoading={isSubmitting}>
              Update Material
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
