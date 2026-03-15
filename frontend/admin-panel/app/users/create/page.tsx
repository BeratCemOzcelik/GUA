'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usersApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  isAdmin: z.boolean().default(false),
  isFaculty: z.boolean().default(false),
  isStudent: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

type UserFormData = z.infer<typeof userSchema>

export default function CreateUserPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      isAdmin: false,
      isFaculty: false,
      isStudent: false,
      isActive: true,
    },
  })

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Build role names array from checkboxes
      const roleNames: string[] = []
      if (data.isAdmin) roleNames.push('Admin')
      if (data.isFaculty) roleNames.push('Faculty')
      if (data.isStudent) roleNames.push('Student')

      // Prepare API request data
      const requestData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        roleNames,
        isActive: data.isActive,
      }

      await usersApi.create(requestData)
      router.push('/users')
    } catch (err: any) {
      console.error('Failed to create user:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create User</h1>
        <p className="text-gray-600 mt-1">Add a new user to the system</p>
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
            label="Email"
            type="email"
            placeholder="user@example.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 6 characters"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              placeholder="Doe"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Roles
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
                  {...register('isAdmin')}
                />
                <label htmlFor="isAdmin" className="ml-2 text-sm font-medium text-gray-700">
                  Admin
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFaculty"
                  className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
                  {...register('isFaculty')}
                />
                <label htmlFor="isFaculty" className="ml-2 text-sm font-medium text-gray-700">
                  Faculty
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isStudent"
                  className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
                  {...register('isStudent')}
                />
                <label htmlFor="isStudent" className="ml-2 text-sm font-medium text-gray-700">
                  Student
                </label>
              </div>
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
              Active User
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
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
