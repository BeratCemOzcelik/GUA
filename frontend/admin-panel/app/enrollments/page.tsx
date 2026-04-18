'use client'

import { useState, useEffect } from 'react'
import { enrollmentsApi, academicTermsApi } from '@/lib/api'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [terms, setTerms] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTermId, setFilterTermId] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const statusColors: Record<string, string> = {
    Enrolled: 'bg-green-100 text-green-700',
    Completed: 'bg-blue-100 text-blue-700',
    Dropped: 'bg-red-100 text-red-700',
    Withdrawn: 'bg-gray-100 text-gray-700',
  }

  const fetchTerms = async () => {
    try {
      const res = await academicTermsApi.getAll()
      setTerms(res.data || [])
    } catch {}
  }

  const fetchEnrollments = async () => {
    try {
      setIsLoading(true)
      setError('')
      const res = await enrollmentsApi.getAll({
        status: filterStatus || undefined,
        termId: filterTermId,
        search: search || undefined,
        page,
        pageSize,
      })
      const data = res.data
      setEnrollments(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load enrollments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTerms()
  }, [])

  useEffect(() => {
    fetchEnrollments()
  }, [filterStatus, filterTermId, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterTermId, search, pageSize])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Enrollments</h1>
        <p className="text-gray-600 mt-1">Manage student course enrollments</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by student name or number..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
          <select
            value={filterTermId || ''}
            onChange={(e) => setFilterTermId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Terms</option>
            {terms.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No enrollments found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Term</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{e.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {e.studentName || `Student #${e.studentId}`}
                      </p>
                      <p className="text-xs text-gray-500">{e.studentNumber || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {e.courseCode || ''} {e.courseName ? `- ${e.courseName}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">Section: {e.section || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.termName || 'N/A'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          statusColors[e.statusText || e.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {e.statusText || e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      {e.finalLetterGrade || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  )
}
