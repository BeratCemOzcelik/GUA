'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface AcademicTerm {
  id: number
  name: string
  code: string
  startDate: string
  endDate: string
  enrollmentStartDate: string
  enrollmentEndDate: string
  isActive: boolean
  createdAt: string
}

const academicTermsApi = {
  getAll: async () => api.get('/academicterms'),
  getById: async (id: number) => api.get(`/academicterms/${id}`),
  create: async (data: any) => api.post('/academicterms', data),
  update: async (id: number, data: any) => api.put(`/academicterms/${id}`, data),
  delete: async (id: number) => api.delete(`/academicterms/${id}`),
}

export default function AcademicTermsPage() {
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    termId: number | null
    termName: string
  }>({
    isOpen: false,
    termId: null,
    termName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchTerms = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await academicTermsApi.getAll()
      setTerms(response.data.data || [])
    } catch (err: any) {
      console.error('Failed to fetch academic terms:', err)
      setError(err.message || 'Failed to load academic terms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTerms()
  }, [])

  const handleDelete = async () => {
    if (!deleteModal.termId) return

    try {
      setIsDeleting(true)
      await academicTermsApi.delete(deleteModal.termId)
      setDeleteModal({ isOpen: false, termId: null, termName: '' })
      fetchTerms()
    } catch (err: any) {
      console.error('Failed to delete academic term:', err)
      alert(err.message || 'Failed to delete academic term')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Terms</h1>
          <p className="text-gray-600 mt-1">Manage academic terms and enrollment periods</p>
        </div>
        <Link href="/academic-terms/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Term
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
        ) : terms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No academic terms found</p>
            <Link href="/academic-terms/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
              Create your first term
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {terms.map((term) => (
                  <tr key={term.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {term.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{term.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(term.startDate).toLocaleDateString()} -{' '}
                      {new Date(term.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(term.enrollmentStartDate).toLocaleDateString()} -{' '}
                      {new Date(term.enrollmentEndDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          term.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {term.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/academic-terms/${term.id}/edit`}>
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
                              termId: term.id,
                              termName: term.name,
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
        onClose={() => setDeleteModal({ isOpen: false, termId: null, termName: '' })}
        title="Delete Academic Term"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.termName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, termId: null, termName: '' })
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
