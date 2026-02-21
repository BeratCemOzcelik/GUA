'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const termSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  enrollmentStartDate: z.string().min(1, 'Enrollment start date is required'),
  enrollmentEndDate: z.string().min(1, 'Enrollment end date is required'),
  isActive: z.boolean().default(true),
})

type TermFormData = z.infer<typeof termSchema>

const academicTermsApi = {
  create: async (data: any) => api.post('/academicterms', data),
}

export default function CreateAcademicTermPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TermFormData>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      isActive: true,
    },
  })

  const onSubmit = async (data: TermFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await academicTermsApi.create(data)
      router.push('/academic-terms')
    } catch (err: any) {
      console.error('Failed to create academic term:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create academic term')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Academic Term</h1>
        <p className="text-gray-600 mt-1">Add a new academic term</p>
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
            label="Term Name"
            placeholder="e.g., Fall 2024"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Term Code"
            placeholder="e.g., FALL2024"
            required
            error={errors.code?.message}
            {...register('code')}
          />

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Term Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                required
                error={errors.startDate?.message}
                {...register('startDate')}
              />

              <Input
                label="End Date"
                type="date"
                required
                error={errors.endDate?.message}
                {...register('endDate')}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Enrollment Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Enrollment Start"
                type="date"
                required
                error={errors.enrollmentStartDate?.message}
                {...register('enrollmentStartDate')}
              />

              <Input
                label="Enrollment End"
                type="date"
                required
                error={errors.enrollmentEndDate?.message}
                {...register('enrollmentEndDate')}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
              {...register('isActive')}
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              Active Term
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
              Create Term
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
