'use client'

import { useState, useEffect } from 'react'
import { enrollmentsApi, studentProfilesApi, courseOfferingsApi, academicTermsApi } from '@/lib/api'

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTerm, setFilterTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [enrollRes, studentRes, termRes] = await Promise.all([
        enrollmentsApi.getAll(),
        studentProfilesApi.getAll(),
        academicTermsApi.getAll(),
      ])
      setEnrollments(enrollRes.data || [])
      setStudents(studentRes.data || [])
      setTerms(termRes.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load enrollments')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = enrollments.filter((e: any) => {
    if (filterStatus && e.status !== filterStatus) return false
    if (filterStudent && !`${e.studentName || ''} ${e.studentNumber || ''}`.toLowerCase().includes(filterStudent.toLowerCase())) return false
    if (filterTerm && String(e.termId || e.courseOffering?.termId) !== filterTerm) return false
    return true
  })

  const statusColors: Record<string, string> = {
    Enrolled: 'bg-green-100 text-green-700',
    Completed: 'bg-blue-100 text-blue-700',
    Dropped: 'bg-red-100 text-red-700',
    Withdrawn: 'bg-gray-100 text-gray-700',
  }

  const statusCounts = enrollments.reduce((acc: any, e: any) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Enrollments</h1>
        <p className="text-gray-600 mt-1">Manage student course enrollments</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Enrolled', 'Completed', 'Dropped'].map(status => (
          <div key={status} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{statusCounts[status] || 0}</p>
            <p className="text-sm text-gray-600">{status}</p>
          </div>
        ))}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search student..."
            value={filterStudent}
            onChange={e => setFilterStudent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
          </select>
          <select
            value={filterTerm}
            onChange={e => setFilterTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Terms</option>
            {terms.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No enrollments found</td></tr>
            ) : (
              filtered.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{e.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{e.studentName || `Student #${e.studentId}`}</p>
                    <p className="text-xs text-gray-500">{e.studentNumber || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{e.courseCode || ''} {e.courseName ? `- ${e.courseName}` : ''}</p>
                    <p className="text-xs text-gray-500">Section: {e.section || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.termName || 'N/A'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[e.status] || 'bg-gray-100 text-gray-700'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    {e.finalLetterGrade || e.letterGrade || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
