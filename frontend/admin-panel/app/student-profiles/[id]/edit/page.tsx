'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { studentProfilesApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

const studentProfileSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional(),
  expectedGraduationDate: z.string().optional(),
  academicStatus: z.string().min(1, 'Please select an academic status'),
})

type StudentProfileFormData = z.infer<typeof studentProfileSchema>

interface StudentProfile {
  id: number
  userId: string
  userFullName: string
  userEmail: string
  studentNumber: string
  programId: number
  programName: string
  departmentName: string
  enrollmentDate: string
  expectedGraduationDate?: string
  currentGPA: number
  totalCreditsEarned: number
  academicStatus: string
  academicStatusText: string
  address?: string
  city?: string
  country?: string
  dateOfBirth?: string
  createdAt: string
}

export default function EditStudentProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await studentProfilesApi.getById(parseInt(params.id))
        const profileData = response.data
        setProfile(profileData)

        // Format dates for input fields (convert from ISO to YYYY-MM-DD)
        const formatDate = (dateString?: string) => {
          if (!dateString) return ''
          return dateString.split('T')[0]
        }

        reset({
          address: profileData.address || '',
          city: profileData.city || '',
          country: profileData.country || '',
          dateOfBirth: formatDate(profileData.dateOfBirth),
          expectedGraduationDate: formatDate(profileData.expectedGraduationDate),
          academicStatus: profileData.academicStatus,
        })
      } catch (err: any) {
        console.error('Failed to fetch student profile:', err)
        setError(err.message || 'Failed to load student profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [params.id, reset])

  const onSubmit = async (data: StudentProfileFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare API request data
      const requestData = {
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        dateOfBirth: data.dateOfBirth || null,
        expectedGraduationDate: data.expectedGraduationDate || null,
        academicStatus: data.academicStatus,
      }

      await studentProfilesApi.update(parseInt(params.id), requestData)
      router.push('/student-profiles')
    } catch (err: any) {
      console.error('Failed to update student profile:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update student profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p>Student profile not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Student Profile</h1>
        <p className="text-gray-600 mt-1">Update student profile information</p>
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

      {/* Read-only Information */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information (Read-only)</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Student Number</p>
            <p className="font-medium text-gray-900">{profile.studentNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Student Name</p>
            <p className="font-medium text-gray-900">{profile.userFullName}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{profile.userEmail}</p>
          </div>
          <div>
            <p className="text-gray-500">Program</p>
            <p className="font-medium text-gray-900">{profile.programName}</p>
          </div>
          <div>
            <p className="text-gray-500">Department</p>
            <p className="font-medium text-gray-900">{profile.departmentName}</p>
          </div>
          <div>
            <p className="text-gray-500">Enrollment Date</p>
            <p className="font-medium text-gray-900">
              {new Date(profile.enrollmentDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Current GPA</p>
            <p className="font-medium text-gray-900">{profile.currentGPA.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Credits Earned</p>
            <p className="font-medium text-gray-900">{profile.totalCreditsEarned}</p>
          </div>
        </div>
      </div>

      {/* Editable Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Editable Information</h3>

          <Select
            label="Academic Status"
            required
            error={errors.academicStatus?.message}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'OnProbation', label: 'On Probation' },
              { value: 'Suspended', label: 'Suspended' },
              { value: 'Graduated', label: 'Graduated' },
              { value: 'Withdrawn', label: 'Withdrawn' },
            ]}
            {...register('academicStatus')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />

            <Input
              label="Expected Graduation Date"
              type="date"
              error={errors.expectedGraduationDate?.message}
              {...register('expectedGraduationDate')}
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>

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
              Update Student Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
