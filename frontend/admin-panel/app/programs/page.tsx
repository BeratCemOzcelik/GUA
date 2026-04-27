'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { programsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Program {
  id: number
  name: string
  departmentName: string
  degreeType: string
  totalCreditsRequired: number
  durationYears: number
  isActive: boolean
  createdAt: string
}

const degreeTypeLabels: Record<string, string> = {
  Bachelor: "Bachelor's",
  Master: "Master's",
  Doctoral: 'Doctoral',
  Associate: 'Associate',
  Certificate: 'Certificate',
}

const PAGE_SIZE = 20

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    programId: number | null
    programName: string
  }>({
    isOpen: false,
    programId: null,
    programName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await programsApi.getAll()
      setPrograms(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch programs:', err)
      setError(err.message || 'Failed to load programs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  // Distinct values for the dropdown filters
  const departmentOptions = useMemo(() => {
    return Array.from(new Set(programs.map((p) => p.departmentName).filter(Boolean))).sort()
  }, [programs])

  const degreeOptions = useMemo(() => {
    return Array.from(new Set(programs.map((p) => p.degreeType).filter(Boolean))).sort()
  }, [programs])

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase()
    return programs.filter((p) => {
      if (departmentFilter && p.departmentName !== departmentFilter) return false
      if (degreeFilter && p.degreeType !== degreeFilter) return false
      if (statusFilter === 'active' && !p.isActive) return false
      if (statusFilter === 'inactive' && p.isActive) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.departmentName || '').toLowerCase().includes(q)
      )
    })
  }, [programs, search, departmentFilter, degreeFilter, statusFilter])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
  }, [search, departmentFilter, degreeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / PAGE_SIZE))
  const pagedPrograms = filteredPrograms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async () => {
    if (!deleteModal.programId) return

    try {
      setIsDeleting(true)
      await programsApi.delete(deleteModal.programId)
      setDeleteModal({ isOpen: false, programId: null, programName: '' })
      fetchPrograms()
    } catch (err: any) {
      console.error('Failed to delete program:', err)
      alert(err.message || 'Failed to delete program')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600 mt-1">Manage academic programs</p>
        </div>
        <Link href="/programs/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Program
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by program or department name…"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A]"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="md:col-span-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
        >
          <option value="">All departments</option>
          {departmentOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={degreeFilter}
          onChange={(e) => setDegreeFilter(e.target.value)}
          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
        >
          <option value="">All degrees</option>
          {degreeOptions.map((d) => (
            <option key={d} value={d}>
              {degreeTypeLabels[d] || d}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="md:col-span-12 text-sm text-gray-500">
          {filteredPrograms.length} of {programs.length}
          {(search || departmentFilter || degreeFilter || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setDepartmentFilter('')
                setDegreeFilter('')
                setStatusFilter('all')
              }}
              className="ml-3 text-[#8B1A1A] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {programs.length === 0 ? 'No programs found' : 'No programs match the current filters'}
            </p>
            {programs.length === 0 && (
              <Link href="/programs/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
                Create your first program
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Degree Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
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
                  {pagedPrograms.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{program.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{program.departmentName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {degreeTypeLabels[program.degreeType] || program.degreeType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {program.totalCreditsRequired}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {program.durationYears} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            program.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {program.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/programs/${program.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              ✏️ Edit
                            </Button>
                          </Link>
                          <Link href={`/programs/${program.id}/curriculum`}>
                            <Button variant="secondary" size="sm">
                              📚 Curriculum
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                programId: program.id,
                                programName: program.name,
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages} · {filteredPrograms.length} results
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ‹ Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next ›
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, programId: null, programName: '' })}
        title="Delete Program"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.programName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, programId: null, programName: '' })
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
