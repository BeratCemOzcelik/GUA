'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { facultyApi, usersApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import FileUpload from '@/components/ui/FileUpload'

const facultySchema = z.object({
  userId: z.string().uuid('Please select a user'),
  title: z.string().optional(),
  bio: z.string().optional(),
  researchInterests: z.string().optional(),
  officeLocation: z.string().optional(),
  officeHours: z.string().optional(),
  photoUrl: z.string().optional(),
  linkedInUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  googleScholarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type FacultyFormData = z.infer<typeof facultySchema>

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface FacultyProfile {
  id: number
  userId: string
  userEmail: string
  firstName: string
  lastName: string
  title?: string
  bio?: string
  researchInterests?: string
  officeLocation?: string
  officeHours?: string
  photoUrl?: string
  linkedInUrl?: string
  googleScholarUrl?: string
  createdAt: string
}

export default function EditFacultyPage() {
  const router = useRouter()
  const params = useParams()
  const facultyId = Number(params.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [uploadedPhoto, setUploadedPhoto] = useState<{
    photoUrl: string
    fileName: string
  } | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch users
        const usersResponse = await usersApi.getAll()
        setUsers(usersResponse.data || [])

        // Fetch faculty profile
        const facultyResponse = await facultyApi.getById(facultyId)
        const faculty = facultyResponse.data

        setCurrentPhotoUrl(faculty.photoUrl || null)
        reset({
          userId: faculty.userId,
          title: faculty.title || '',
          bio: faculty.bio || '',
          researchInterests: faculty.researchInterests || '',
          officeLocation: faculty.officeLocation || '',
          officeHours: faculty.officeHours || '',
          photoUrl: faculty.photoUrl || '',
          linkedInUrl: faculty.linkedInUrl || '',
          googleScholarUrl: faculty.googleScholarUrl || '',
        })
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError(err.message || 'Failed to load faculty profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (facultyId) {
      fetchData()
    }
  }, [facultyId, reset, setValue])

  const handlePhotoUploadSuccess = (photoUrl: string, fileName: string) => {
    setUploadedPhoto({
      photoUrl,
      fileName,
    })
    setValue('photoUrl', photoUrl)
    setCurrentPhotoUrl(photoUrl)
  }

  const onSubmit = async (data: FacultyFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await facultyApi.update(facultyId, {
        userId: data.userId,
        title: data.title || null,
        bio: data.bio || null,
        researchInterests: data.researchInterests || null,
        officeLocation: data.officeLocation || null,
        officeHours: data.officeHours || null,
        photoUrl: data.photoUrl || currentPhotoUrl || null,
        linkedInUrl: data.linkedInUrl || null,
        googleScholarUrl: data.googleScholarUrl || null,
      })
      router.push('/faculty')
    } catch (err: any) {
      console.error('Failed to update faculty profile:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update faculty profile')
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Faculty Profile</h1>
        <p className="text-gray-600 mt-1">Update faculty member information</p>
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
          {/* User Selection */}
          <Select
            label="Select User"
            required
            error={errors.userId?.message}
            options={users.map((user) => ({
              value: user.id,
              label: `${user.firstName} ${user.lastName} (${user.email})`,
            }))}
            {...register('userId')}
          />

          {/* Title */}
          <Input
            label="Title"
            placeholder="e.g., Professor, Associate Professor, Assistant Professor"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Photo Upload */}
          <div>
            {currentPhotoUrl && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Photo
                </label>
                <div className="flex items-center space-x-4">
                  <img
                    src={currentPhotoUrl.startsWith('http') ? currentPhotoUrl : `http://localhost:5000${currentPhotoUrl}`}
                    alt="Current faculty photo"
                    className="h-32 w-32 rounded-lg object-cover border-2 border-gray-200"
                  />
                  <p className="text-sm text-gray-600">
                    Upload a new photo to replace the current one
                  </p>
                </div>
              </div>
            )}
            <FileUpload
              label="Update Faculty Photo"
              folder="faculty-photos"
              maxSizeMB={5}
              accept="image/*"
              preview={true}
              onUploadSuccess={handlePhotoUploadSuccess}
              onUploadError={(error) => setError(error)}
            />
            {uploadedPhoto && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  New photo uploaded: <strong>{uploadedPhoto.fileName}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Bio */}
          <Textarea
            label="Bio"
            placeholder="Brief biography of the faculty member..."
            rows={4}
            error={errors.bio?.message}
            {...register('bio')}
          />

          {/* Research Interests */}
          <Textarea
            label="Research Interests"
            placeholder="Areas of research interest (comma-separated)..."
            rows={3}
            error={errors.researchInterests?.message}
            {...register('researchInterests')}
          />

          {/* Office Location */}
          <Input
            label="Office Location"
            placeholder="e.g., Room 301, Building A"
            error={errors.officeLocation?.message}
            {...register('officeLocation')}
          />

          {/* Office Hours */}
          <Textarea
            label="Office Hours"
            placeholder="e.g., Monday 2-4 PM, Wednesday 10 AM-12 PM"
            rows={2}
            error={errors.officeHours?.message}
            {...register('officeHours')}
          />

          {/* Social Links */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="LinkedIn URL"
              type="url"
              placeholder="https://linkedin.com/in/..."
              error={errors.linkedInUrl?.message}
              {...register('linkedInUrl')}
            />

            <Input
              label="Google Scholar URL"
              type="url"
              placeholder="https://scholar.google.com/citations?user=..."
              error={errors.googleScholarUrl?.message}
              {...register('googleScholarUrl')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Update Faculty Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
