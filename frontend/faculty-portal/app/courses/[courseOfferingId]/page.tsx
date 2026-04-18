'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'

interface CourseOffering {
  id: number
  courseCode: string
  courseName: string
  section: string
  termName: string
  schedule?: string
  location?: string
  capacity: number
  enrolledCount: number
}

interface EnrolledStudent {
  enrollmentId: number
  studentId: number
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  enrollmentDate: string
  status: string
  statusText: string
  hasFinalGrade: boolean
  finalLetterGrade?: string
  finalNumericGrade?: number
}

const STATUS_OPTIONS = ['Enrolled', 'Dropped', 'Completed', 'Withdrawn']

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseOfferingIdRaw = parseInt(params.courseOfferingId as string)
  const courseOfferingId = Number.isFinite(courseOfferingIdRaw) ? courseOfferingIdRaw : 0
  const isValidCourseId = courseOfferingId > 0

  const [courseInfo, setCourseInfo] = useState<CourseOffering | null>(null)
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isValidCourseId) return
    loadCourseInfo()
  }, [courseOfferingId, isValidCourseId])

  useEffect(() => {
    if (!isValidCourseId) return
    loadStudents()
  }, [courseOfferingId, isValidCourseId, statusFilter, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search, pageSize])

  const loadCourseInfo = async () => {
    try {
      const res = await api.get(`/courseofferings/${courseOfferingId}`)
      setCourseInfo(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course info')
    }
  }

  const loadStudents = async () => {
    try {
      setIsLoading(true)
      setError('')

      const qs = new URLSearchParams()
      if (statusFilter) qs.append('status', statusFilter)
      if (search) qs.append('search', search)
      qs.append('page', page.toString())
      qs.append('pageSize', pageSize.toString())

      const res = await api.get(`/enrollments/by-course-offering/${courseOfferingId}/students?${qs.toString()}`)
      const data = res.data.data
      setStudents(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidCourseId) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          Invalid course offering id.
        </div>
        <button onClick={() => router.push('/courses')} className="px-4 py-2 text-[#8B1A1A] hover:underline">
          ← Back to My Courses
        </button>
      </div>
    )
  }

  if (!courseInfo && !isLoading) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
        Course not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={() => router.back()} className="flex items-center text-[#8B1A1A] hover:underline">
        <span className="mr-2">←</span>
        Back to My Courses
      </button>

      {/* Course Header */}
      {courseInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {courseInfo.courseCode} - {courseInfo.courseName}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Section: {courseInfo.section}</span>
                <span>•</span>
                <span>Term: {courseInfo.termName}</span>
                {courseInfo.schedule && (
                  <>
                    <span>•</span>
                    <span>Schedule: {courseInfo.schedule}</span>
                  </>
                )}
                {courseInfo.location && (
                  <>
                    <span>•</span>
                    <span>Location: {courseInfo.location}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Enrollment</p>
              <p className="text-3xl font-bold text-[#8B1A1A]">
                {courseInfo.enrolledCount} / {courseInfo.capacity}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/grades/${courseOfferingId}`}
          className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-3xl">📝</span>
          <div>
            <p className="font-semibold text-gray-900">Enter Grades</p>
            <p className="text-xs text-gray-600">Grade students</p>
          </div>
        </Link>

        <Link
          href={`/materials?courseOfferingId=${courseOfferingId}`}
          className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-3xl">📁</span>
          <div>
            <p className="font-semibold text-gray-900">Course Materials</p>
            <p className="text-xs text-gray-600">Upload materials</p>
          </div>
        </Link>

        <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
          <span className="text-3xl">👥</span>
          <div>
            <p className="font-semibold text-gray-900">Students</p>
            <p className="text-xs text-gray-600">{totalCount} total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, student number, or email..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
      )}

      {/* Enrolled Students */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Enrolled Students ({totalCount})</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No students found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Enrolled Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Final Grade</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.enrollmentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{student.studentNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.hasFinalGrade ? (
                          <span className="text-sm font-bold text-green-600">
                            {student.finalLetterGrade} ({student.finalNumericGrade?.toFixed(1)})
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Not graded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            student.status === 'Enrolled'
                              ? 'bg-green-100 text-green-700'
                              : student.status === 'Dropped'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {student.statusText}
                        </span>
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
    </div>
  )
}
