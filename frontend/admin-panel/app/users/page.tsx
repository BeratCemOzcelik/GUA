'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usersApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  isActive: boolean
  createdAt: string
}

const ROLE_OPTIONS = ['SuperAdmin', 'Admin', 'Faculty', 'Student']

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [role, setRole] = useState<string>('')
  const [isActive, setIsActive] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    userId: string | null
    userName: string
  }>({
    isOpen: false,
    userId: null,
    userName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersApi.getAll({
        role: role || undefined,
        isActive: isActive === '' ? undefined : isActive === 'true',
        search: search || undefined,
        page,
        pageSize,
      })
      const data = response.data
      setUsers(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [role, isActive, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [role, isActive, search, pageSize])

  const handleDelete = async () => {
    if (!deleteModal.userId) return

    try {
      setIsDeleting(true)
      await usersApi.delete(deleteModal.userId)
      setDeleteModal({ isOpen: false, userId: null, userName: '' })
      fetchUsers()
    } catch (err: any) {
      console.error('Failed to delete user:', err)
      alert(err.message || 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users and roles</p>
        </div>
        <Link href="/users/create">
          <Button>
            <span className="mr-2">➕</span>
            Add User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
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
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#8B1A1A] rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <span
                              key={r}
                              className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/users/${user.id}/edit`}>
                            <Button variant="secondary" size="sm">✏️ Edit</Button>
                          </Link>
                          <Link href={`/users/${user.id}/roles`}>
                            <Button variant="secondary" size="sm">🔑 Roles</Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                userId: user.id,
                                userName: `${user.firstName} ${user.lastName}`,
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
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.userName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
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
