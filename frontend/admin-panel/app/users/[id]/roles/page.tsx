'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usersApi } from '@/lib/api'
import Button from '@/components/ui/Button'

const AVAILABLE_ROLES = ['SuperAdmin', 'Admin', 'Faculty', 'Student']

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export default function UserRolesPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const response = await usersApi.getById(userId)
        setUser(response.data)
        setSelectedRoles(response.data.roles || [])
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
  }, [userId])

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      await usersApi.assignRoles(userId, selectedRoles)
      router.push('/users')
    } catch (err: any) {
      console.error('Failed to assign roles:', err)
      setError(err.response?.data?.message || err.message || 'Failed to assign roles')
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage User Roles</h1>
        <p className="text-gray-600 mt-1">
          Assign roles to {user.firstName} {user.lastName} ({user.email})
        </p>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Roles
            </label>
            <div className="space-y-3">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleToggleRole(role)}
                    className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
                  />
                  <label
                    htmlFor={role}
                    className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {role}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Roles:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedRoles.length === 0 ? (
                <span className="text-sm text-gray-500">No roles selected</span>
              ) : (
                selectedRoles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800"
                  >
                    {role}
                  </span>
                ))
              )}
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
              Save Roles
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
