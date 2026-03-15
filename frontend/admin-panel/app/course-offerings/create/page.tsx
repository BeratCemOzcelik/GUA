'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { courseOfferingsApi, coursesApi, academicTermsApi, facultyApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const courseOfferingSchema = z.object({
  courseId: z.number().min(1, 'Course is required'),
  termId: z.number().min(1, 'Academic term is required'),
  facultyProfileId: z.number().min(1, 'Faculty is required'),
  section: z.string().min(1, 'Section is required').default('A'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  schedule: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CourseOfferingFormData = z.infer<typeof courseOfferingSchema>

interface Course {
  id: number
  code: string
  name: string
}

interface AcademicTerm {
  id: number
  name: string
  code: string
}

interface FacultyProfile {
  id: number
  firstName: string
  lastName: string
  title: string
}

export default function CreateCourseOfferingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [faculty, setFaculty] = useState<FacultyProfile[]>([])
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseOfferingFormData>({
    resolver: zodResolver(courseOfferingSchema),
    defaultValues: {
      section: 'A',
      isActive: true,
      capacity: 30,
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [coursesRes, termsRes, facultyRes] = await Promise.all([
          coursesApi.getAll(),
          academicTermsApi.getAll(),
          facultyApi.getAll(),
        ])
        setCourses(coursesRes.data || [])
        setTerms(termsRes.data || [])
        setFaculty(facultyRes.data || [])
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError(err.message || 'Failed to load form data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: CourseOfferingFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await courseOfferingsApi.create(data)
      router.push('/course-offerings')
    } catch (err: any) {
      console.error('Failed to create course offering:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create course offering')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
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
        <h1 className="text-3xl font-bold text-gray-900">Create Course Offering</h1>
        <p className="text-gray-600 mt-1">Add a new course offering for a term</p>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              {...register('courseId', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="mt-1 text-sm text-red-600">{errors.courseId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Term <span className="text-red-500">*</span>
            </label>
            <select
              {...register('termId', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
            >
              <option value="">Select a term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} ({term.code})
                </option>
              ))}
            </select>
            {errors.termId && (
              <p className="mt-1 text-sm text-red-600">{errors.termId.message}</p>
            )}
          </div>

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
                  {f.firstName} {f.lastName} ({f.title || 'Faculty'})
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
              Create Course Offering
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
