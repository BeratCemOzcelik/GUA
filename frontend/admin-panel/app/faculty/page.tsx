'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { facultyApi, getFileUrl } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

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

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<FacultyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    facultyId: number | null
    facultyName: string
  }>({
    isOpen: false,
    facultyId: null,
    facultyName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchFaculty = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await facultyApi.getAll()
      setFaculty(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch faculty profiles:', err)
      setError(err.message || 'Failed to load faculty profiles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaculty()
  }, [])

  const handleDelete = async () => {
    if (!deleteModal.facultyId) return

    try {
      setIsDeleting(true)
      await facultyApi.delete(deleteModal.facultyId)
      setDeleteModal({ isOpen: false, facultyId: null, facultyName: '' })
      fetchFaculty() // Refresh list
    } catch (err: any) {
      console.error('Failed to delete faculty profile:', err)
      alert(err.message || 'Failed to delete faculty profile')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Profiles</h1>
          <p className="text-gray-600 mt-1">Manage university faculty members</p>
        </div>
        <Link href="/faculty/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Faculty
          </Button>
        </Link>
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : faculty.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No faculty profiles found</p>
            <Link href="/faculty/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
              Create your first faculty profile
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Office Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faculty.map((prof) => (
                  <tr key={prof.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover border-2 border-[#8B1A1A]"
                          src={prof.photoUrl ? getFileUrl(prof.photoUrl) : '/images/avatar-placeholder.png'}
                          alt={`${prof.firstName} ${prof.lastName}`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {prof.firstName} {prof.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {prof.title || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {prof.officeLocation || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {prof.userEmail}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/faculty/${prof.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            ✏️ Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              facultyId: prof.id,
                              facultyName: `${prof.firstName} ${prof.lastName}`,
                            })
                          }
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, facultyId: null, facultyName: '' })}
        title="Delete Faculty Profile"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.facultyName}</strong>&apos;s profile?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, facultyId: null, facultyName: '' })
              }
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
