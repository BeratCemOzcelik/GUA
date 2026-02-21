'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usersApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const userSchema = z.object({
  email: z.string().email('Must be a valid email'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  isActive: z.boolean().default(true),
})

type UserFormData = z.infer<typeof userSchema>

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const response = await usersApi.getById(userId)
        reset({
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          isActive: response.data.isActive,
        })
      } catch (err: any) {
        console.error('Failed to fetch user:', err)
        setError(err.message || 'Failed to load user')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId, reset])

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await usersApi.update(userId, data)
      router.push('/users')
    } catch (err: any) {
      console.error('Failed to update user:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update user')
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
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-600 mt-1">Update user information</p>
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
              Update User
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
