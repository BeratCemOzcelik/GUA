'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { studentProfilesApi, programsApi, usersApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

const studentProfileSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  programId: z.number().min(1, 'Please select a program'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  expectedGraduationDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional(),
})

type StudentProfileFormData = z.infer<typeof studentProfileSchema>

interface Program {
  id: number
  name: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export default function CreateStudentProfilePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
  })

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await programsApi.getAll()
        setPrograms(response.data || [])
      } catch (err: any) {
        console.error('Failed to fetch programs:', err)
      }
    }

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await usersApi.getAll({ role: 'Student', pageSize: 1000 })
        setUsers(response.data?.items || [])
      } catch (err: any) {
        console.error('Failed to fetch users:', err)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchPrograms()
    fetchUsers()
  }, [])

  const onSubmit = async (data: StudentProfileFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare API request data
      const requestData = {
        userId: data.userId,
        programId: data.programId,
        enrollmentDate: data.enrollmentDate,
        expectedGraduationDate: data.expectedGraduationDate || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        dateOfBirth: data.dateOfBirth || null,
      }

      await studentProfilesApi.create(requestData)
      router.push('/student-profiles')
    } catch (err: any) {
      console.error('Failed to create student profile:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create student profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Student Profile</h1>
        <p className="text-gray-600 mt-1">Add a new student profile to the system</p>
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

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-xl mr-2">ℹ️</span>
          <div>
            <p className="font-medium">Auto-generated Fields</p>
            <p className="text-sm mt-1">
              The system will automatically generate: Student Number, Current GPA (0.0), Total Credits Earned (0), and Academic Status (Active).
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Select
            label="Student User"
            required
            error={errors.userId?.message}
            options={users.map((user) => ({
              value: user.id,
              label: `${user.firstName} ${user.lastName} (${user.email})`,
            }))}
            disabled={loadingUsers}
            {...register('userId')}
          />

          <Select
            label="Program"
            required
            error={errors.programId?.message}
            options={programs.map((program) => ({
              value: program.id,
              label: program.name,
            }))}
            {...register('programId', { valueAsNumber: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Enrollment Date"
              type="date"
              required
              error={errors.enrollmentDate?.message}
              {...register('enrollmentDate')}
            />

            <Input
              label="Expected Graduation Date"
              type="date"
              error={errors.expectedGraduationDate?.message}
              {...register('expectedGraduationDate')}
            />
          </div>

          <Input
            label="Date of Birth"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>

            <div className="space-y-4">
              <Input
                label="Address"
                placeholder="Street address"
                error={errors.address?.message}
                {...register('address')}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="City"
                  error={errors.city?.message}
                  {...register('city')}
                />

                <Input
                  label="Country"
                  placeholder="Country"
                  error={errors.country?.message}
                  {...register('country')}
                />
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
              Create Student Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
