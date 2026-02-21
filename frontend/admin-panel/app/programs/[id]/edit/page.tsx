'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { programsApi, departmentsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

const programSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  departmentId: z.number().min(1, 'Please select a department'),
  degreeType: z.enum(['Bachelor', 'Master', 'Doctoral'], {
    required_error: 'Please select a degree type',
  }),
  totalCreditsRequired: z.number().min(1, 'Credits required must be at least 1'),
  durationYears: z.number().min(1, 'Duration must be at least 1 year').max(10, 'Duration must be at most 10 years'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

type ProgramFormData = z.infer<typeof programSchema>

export default function EditProgramPage() {
  const router = useRouter()
  const params = useParams()
  const programId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [programResponse, departmentsResponse] = await Promise.all([
          programsApi.getById(programId),
          departmentsApi.getAll(),
        ])

        setDepartments(departmentsResponse.data || [])
        reset({
          name: programResponse.data.name,
          departmentId: programResponse.data.departmentId,
          degreeType: programResponse.data.degreeType,
          totalCreditsRequired: programResponse.data.totalCreditsRequired,
          durationYears: programResponse.data.durationYears,
          description: programResponse.data.description || '',
          isActive: programResponse.data.isActive,
        })
      } catch (err: any) {
        console.error('Failed to fetch program:', err)
        setError(err.message || 'Failed to load program')
      } finally {
        setIsLoading(false)
      }
    }

    if (programId) {
      fetchData()
    }
  }, [programId, reset])

  const onSubmit = async (data: ProgramFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await programsApi.update(programId, data)
      router.push('/programs')
    } catch (err: any) {
      console.error('Failed to update program:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update program')
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Program</h1>
        <p className="text-gray-600 mt-1">Update program information</p>
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
            label="Program Name"
            placeholder="e.g., Bachelor of Science in Computer Science"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <Select
            label="Department"
            required
            error={errors.departmentId?.message}
            options={departments.map((dept) => ({
              value: dept.id,
              label: dept.name,
            }))}
            {...register('departmentId', { valueAsNumber: true })}
          />

          <Select
            label="Degree Type"
            required
            error={errors.degreeType?.message}
            options={[
              { value: 'Bachelor', label: 'Bachelor\'s Degree' },
              { value: 'Master', label: 'Master\'s Degree' },
              { value: 'Doctoral', label: 'Doctoral Degree' },
            ]}
            {...register('degreeType')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Credits Required"
              type="number"
              placeholder="e.g., 120"
              required
              error={errors.totalCreditsRequired?.message}
              {...register('totalCreditsRequired', { valueAsNumber: true })}
            />

            <Input
              label="Duration (Years)"
              type="number"
              placeholder="e.g., 4"
              required
              error={errors.durationYears?.message}
              {...register('durationYears', { valueAsNumber: true })}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Brief description of the program..."
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
              Active Program
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
              Update Program
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
