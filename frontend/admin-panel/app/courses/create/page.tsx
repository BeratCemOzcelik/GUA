'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { coursesApi, departmentsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

const courseSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code must be at most 20 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  departmentId: z.number().nullable().optional(),
  credits: z.number().min(1, 'Credits must be at least 1').max(10, 'Credits must be at most 10'),
  description: z.string().optional(),
  syllabus: z.string().optional(),
  isActive: z.boolean().default(true),
})

type CourseFormData = z.infer<typeof courseSchema>

export default function CreateCoursePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      isActive: true,
    },
  })

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentsApi.getAll()
        setDepartments(response.data || [])
      } catch (err: any) {
        console.error('Failed to fetch departments:', err)
      }
    }
    fetchDepartments()
  }, [])

  const onSubmit = async (data: CourseFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await coursesApi.create(data)
      router.push('/courses')
    } catch (err: any) {
      console.error('Failed to create course:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create course')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Course</h1>
        <p className="text-gray-600 mt-1">Add a new course to the catalog</p>
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Code"
              placeholder="e.g., CS101"
              required
              error={errors.code?.message}
              {...register('code')}
            />

            <Input
              label="Credits"
              type="number"
              placeholder="e.g., 3"
              required
              error={errors.credits?.message}
              {...register('credits', { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Course Name"
            placeholder="e.g., Introduction to Computer Science"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <Select
            label="Department (optional)"
            error={errors.departmentId?.message}
            options={[
              { value: '', label: '— None / Cross-listed —' },
              ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
            ]}
            {...register('departmentId', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of the course..."
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <Textarea
            label="Syllabus"
            placeholder="Detailed course syllabus, topics covered, learning objectives..."
            rows={6}
            error={errors.syllabus?.message}
            {...register('syllabus')}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
              {...register('isActive')}
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              Active Course
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
              Create Course
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
