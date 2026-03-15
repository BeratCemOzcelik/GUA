'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

interface FacultyProfile {
  id: number
  userId: string
  title: string
  bio: string
  researchInterests: string
  officeLocation: string
  officeHours: string
  photoUrl?: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<FacultyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [researchInterests, setResearchInterests] = useState('')
  const [officeLocation, setOfficeLocation] = useState('')
  const [officeHours, setOfficeHours] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await api.get('/FacultyProfiles/my-profile')
      const data = response.data.data
      setProfile(data)

      // Populate form
      setTitle(data.title || '')
      setBio(data.bio || '')
      setResearchInterests(data.researchInterests || '')
      setOfficeLocation(data.officeLocation || '')
      setOfficeHours(data.officeHours || '')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile')
      console.error('Load profile error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setError('')

    try {
      setSaving(true)

      await api.put('/FacultyProfiles/my-profile', {
        title,
        bio,
        researchInterests,
        officeLocation,
        officeHours,
      })

      setSuccess('Profile updated successfully!')
      loadProfile()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile')
      console.error('Update profile error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Faculty Profile</h1>

      {/* User Info (Read-only) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">First Name</p>
            <p className="font-semibold text-gray-900">{user?.firstName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Name</p>
            <p className="font-semibold text-gray-900">{user?.lastName}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold text-gray-900">{user?.email}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Contact administrator to update account information.
        </p>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Faculty Details</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title / Position
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
              placeholder="e.g., Professor, Associate Professor, Assistant Professor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
              placeholder="Brief biography..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Interests
            </label>
            <textarea
              value={researchInterests}
              onChange={(e) => setResearchInterests(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
              placeholder="Your research interests..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Location
            </label>
            <input
              type="text"
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
              placeholder="e.g., Building A, Room 301"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Hours
            </label>
            <input
              type="text"
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
              placeholder="e.g., Mon & Wed 2:00 PM - 4:00 PM"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-[#8B1A1A] text-white rounded-lg font-semibold hover:bg-[#6B1414] transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
