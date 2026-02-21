'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { departmentsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Department {
  id: number
  name: string
  code: string
  description?: string
  isActive: boolean
  createdAt: string
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    departmentId: number | null
    departmentName: string
  }>({
    isOpen: false,
    departmentId: null,
    departmentName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await departmentsApi.getAll()
      setDepartments(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch departments:', err)
      setError(err.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleDelete = async () => {
    if (!deleteModal.departmentId) return

    try {
      setIsDeleting(true)
      await departmentsApi.delete(deleteModal.departmentId)
      setDeleteModal({ isOpen: false, departmentId: null, departmentName: '' })
      fetchDepartments() // Refresh list
    } catch (err: any) {
      console.error('Failed to delete department:', err)
      alert(err.message || 'Failed to delete department')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage university departments</p>
        </div>
        <Link href="/departments/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Department
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
        ) : departments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No departments found</p>
            <Link href="/departments/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
              Create your first department
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
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {dept.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{dept.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {dept.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          dept.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dept.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/departments/${dept.id}/edit`}>
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
                              departmentId: dept.id,
                              departmentName: dept.name,
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
        onClose={() => setDeleteModal({ isOpen: false, departmentId: null, departmentName: '' })}
        title="Delete Department"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.departmentName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, departmentId: null, departmentName: '' })
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
