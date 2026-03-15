'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  requirements: z.string().optional(),
  tuitionFee: z.number().optional(),
  isActive: z.boolean().default(true),
})

type ProgramFormData = z.infer<typeof programSchema>

export default function CreateProgramPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
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

  const onSubmit = async (data: ProgramFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await programsApi.create(data)
      router.push('/programs')
    } catch (err: any) {
      console.error('Failed to create program:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create program')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Program</h1>
        <p className="text-gray-600 mt-1">Add a new academic program</p>
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

          <Textarea
            label="Requirements"
            placeholder="Admission requirements, prerequisites, etc..."
            rows={3}
            error={errors.requirements?.message}
            {...register('requirements')}
          />

          <Input
            label="Tuition Fee (Optional)"
            type="number"
            step="0.01"
            placeholder="e.g., 15000.00"
            error={errors.tuitionFee?.message}
            {...register('tuitionFee', { valueAsNumber: true })}
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
              Create Program
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
