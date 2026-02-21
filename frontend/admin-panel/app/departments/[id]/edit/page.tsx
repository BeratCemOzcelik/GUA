'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { departmentsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be at most 10 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

type DepartmentFormData = z.infer<typeof departmentSchema>

export default function EditDepartmentPage() {
  const router = useRouter()
  const params = useParams()
  const departmentId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  })

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setIsLoading(true)
        const response = await departmentsApi.getById(departmentId)
        reset({
          name: response.data.name,
          code: response.data.code,
          description: response.data.description || '',
          isActive: response.data.isActive,
        })
      } catch (err: any) {
        console.error('Failed to fetch department:', err)
        setError(err.message || 'Failed to load department')
      } finally {
        setIsLoading(false)
      }
    }

    if (departmentId) {
      fetchDepartment()
    }
  }, [departmentId, reset])

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await departmentsApi.update(departmentId, data)
      router.push('/departments')
    } catch (err: any) {
      console.error('Failed to update department:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update department')
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Department</h1>
        <p className="text-gray-600 mt-1">Update department information</p>
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
            label="Department Name"
            placeholder="e.g., Computer Science"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Department Code"
            placeholder="e.g., CS"
            required
            error={errors.code?.message}
            {...register('code')}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of the department..."
            rows={4}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
              {...register('isActive')}
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              Active Department
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
              Update Department
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
