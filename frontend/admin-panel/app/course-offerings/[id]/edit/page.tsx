'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { courseOfferingsApi, facultyApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const courseOfferingSchema = z.object({
  facultyProfileId: z.number().min(1, 'Faculty is required'),
  section: z.string().min(1, 'Section is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  schedule: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CourseOfferingFormData = z.infer<typeof courseOfferingSchema>

interface FacultyProfile {
  id: number
  name: string
  title: string
}

interface CourseOffering {
  id: number
  courseCode: string
  courseName: string
  termName: string
  termCode: string
  facultyProfileId: number
  section: string
  capacity: number
  schedule?: string
  location?: string
  isActive: boolean
}

export default function EditCourseOfferingPage() {
  const router = useRouter()
  const params = useParams()
  const offeringId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [faculty, setFaculty] = useState<FacultyProfile[]>([])
  const [offering, setOffering] = useState<CourseOffering | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseOfferingFormData>({
    resolver: zodResolver(courseOfferingSchema),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [offeringRes, facultyRes] = await Promise.all([
          courseOfferingsApi.getById(offeringId),
          facultyApi.getAll(),
        ])

        const offeringData = offeringRes.data
        setOffering(offeringData)
        setFaculty(facultyRes.data || [])

        reset({
          facultyProfileId: offeringData.facultyProfileId,
          section: offeringData.section,
          capacity: offeringData.capacity,
          schedule: offeringData.schedule || '',
          location: offeringData.location || '',
          isActive: offeringData.isActive,
        })
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError(err.message || 'Failed to load course offering')
      } finally {
        setIsLoading(false)
      }
    }

    if (offeringId) {
      fetchData()
    }
  }, [offeringId, reset])

  const onSubmit = async (data: CourseOfferingFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await courseOfferingsApi.update(offeringId, data)
      router.push('/course-offerings')
    } catch (err: any) {
      console.error('Failed to update course offering:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update course offering')
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Course Offering</h1>
        <p className="text-gray-600 mt-1">Update course offering information</p>
      </div>

      {/* Read-only Info */}
      {offering && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Course & Term (Read-only)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Course</p>
              <p className="text-sm font-medium text-gray-900">
                {offering.courseCode} - {offering.courseName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Academic Term</p>
              <p className="text-sm font-medium text-gray-900">
                {offering.termName} ({offering.termCode})
              </p>
            </div>
          </div>
        </div>
      )}

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faculty <span className="text-red-500">*</span>
            </label>
            <select
              {...register('facultyProfileId', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
            >
              <option value="">Select a faculty member</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.title})
                </option>
              ))}
            </select>
            {errors.facultyProfileId && (
              <p className="mt-1 text-sm text-red-600">{errors.facultyProfileId.message}</p>
            )}
          </div>

          <Input
            label="Section"
            placeholder="e.g., A, B, C"
            required
            error={errors.section?.message}
            {...register('section')}
          />

          <Input
            label="Capacity"
            type="number"
            placeholder="e.g., 30"
            required
            error={errors.capacity?.message}
            {...register('capacity', { valueAsNumber: true })}
          />

          <Input
            label="Schedule"
            placeholder="e.g., Mon/Wed 9:00-11:00"
            error={errors.schedule?.message}
            {...register('schedule')}
          />

          <Input
            label="Location"
            placeholder="e.g., Room 201"
            error={errors.location?.message}
            {...register('location')}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
              {...register('isActive')}
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              Active Course Offering
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
              Update Course Offering
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
