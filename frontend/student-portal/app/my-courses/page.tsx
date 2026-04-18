'use client'

import { useState, useEffect } from 'react'
import { enrollmentsApi, academicTermsApi } from '@/lib/api'
import { Enrollment, AcademicTerm } from '@/lib/types'
import CourseCard from '@/components/CourseCard'
import ConfirmModal from '@/components/ConfirmModal'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [terms, setTerms] = useState<AcademicTerm[]>([])

  const [selectedTerm, setSelectedTerm] = useState<number | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [droppingEnrollmentId, setDroppingEnrollmentId] = useState<number | null>(null)

  const [confirmDropModal, setConfirmDropModal] = useState<{
    isOpen: boolean
    enrollmentId: number | null
    courseName: string
  }>({ isOpen: false, enrollmentId: null, courseName: '' })

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error'
  }>({ isOpen: false, title: '', message: '', type: 'success' })

  useEffect(() => {
    loadTerms()
  }, [])

  useEffect(() => {
    loadEnrollments()
  }, [selectedTerm, selectedStatus, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [selectedTerm, selectedStatus, search, pageSize])

  const loadTerms = async () => {
    try {
      const response = await academicTermsApi.getAll()
      setTerms(response.data)

      const currentTerm = response.data.find((t: AcademicTerm) => t.isCurrent)
      if (currentTerm) {
        setSelectedTerm(currentTerm.id)
      }
    } catch (err: any) {
      console.error('Failed to load terms:', err)
    }
  }

  const loadEnrollments = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await enrollmentsApi.getMyEnrollments({
        termId: selectedTerm,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: search || undefined,
        page,
        pageSize,
      })

      const data = response.data
      const items = data?.items || []

      const mappedEnrollments = items.map((enrollment: any) => ({
        ...enrollment,
        courseOffering: {
          id: enrollment.courseOfferingId,
          courseCode: enrollment.courseCode,
          courseName: enrollment.courseName,
          section: enrollment.section,
          termName: enrollment.termName,
          facultyName: enrollment.facultyName,
          schedule: enrollment.schedule,
          location: enrollment.location,
          credits: enrollment.credits,
        },
      }))

      setEnrollments(mappedEnrollments)
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load enrollments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDropCourse = (enrollmentId: number, courseName: string) => {
    setConfirmDropModal({ isOpen: true, enrollmentId, courseName })
  }

  const confirmDropCourse = async () => {
    if (!confirmDropModal.enrollmentId) return

    const { enrollmentId, courseName } = confirmDropModal
    setConfirmDropModal({ isOpen: false, enrollmentId: null, courseName: '' })

    try {
      setDroppingEnrollmentId(enrollmentId)
      await enrollmentsApi.drop(enrollmentId)

      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: `Successfully dropped ${courseName}!`,
        type: 'success',
      })
      loadEnrollments()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to drop course'
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error',
      })
    } finally {
      setDroppingEnrollmentId(null)
    }
  }

  const cancelDropCourse = () => {
    setConfirmDropModal({ isOpen: false, enrollmentId: null, courseName: '' })
  }

  const closeAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'success' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Enrolled':
        return 'bg-green-100 text-green-700'
      case 'Dropped':
        return 'bg-red-100 text-red-700'
      case 'Completed':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return null

    const gradeColors: { [key: string]: string } = {
      A: 'bg-green-100 text-green-700',
      'A-': 'bg-green-100 text-green-700',
      'B+': 'bg-blue-100 text-blue-700',
      B: 'bg-blue-100 text-blue-700',
      'B-': 'bg-blue-100 text-blue-700',
      'C+': 'bg-amber-100 text-amber-700',
      C: 'bg-amber-100 text-amber-700',
      'C-': 'bg-amber-100 text-amber-700',
      D: 'bg-orange-100 text-orange-700',
      F: 'bg-red-100 text-red-700',
    }

    return gradeColors[grade] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">View and manage your enrolled courses</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by course code or name..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Term</label>
            <select
              value={selectedTerm || ''}
              onChange={(e) => setSelectedTerm(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">All Terms</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No courses found for the selected filters.</p>
            <p className="text-sm text-gray-500 mt-2">
              Visit your{' '}
              <a href="/program-plan" className="text-primary hover:underline">
                Program Plan
              </a>{' '}
              to start a course.
            </p>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {enrollments.length} of {totalCount} course{totalCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrollments.map((enrollment) => {
                  const isDropping = droppingEnrollmentId === enrollment.id
                  const canDrop = enrollment.status === 'Enrolled'

                  return (
                    <CourseCard
                      key={enrollment.id}
                      course={enrollment.courseOffering}
                      action={
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(enrollment.status)}`}>
                              {enrollment.status}
                            </span>
                            {enrollment.finalGrade && (
                              <span className={`text-sm px-3 py-1 rounded-full font-bold ${getGradeBadge(enrollment.finalGrade)}`}>
                                Grade: {enrollment.finalGrade}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <a
                                href={`/materials/${enrollment.courseOffering.id}`}
                                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                              >
                                📚 Materials
                              </a>
                              <a
                                href={`/grades/${enrollment.id}`}
                                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors text-center"
                              >
                                📊 Grades
                              </a>
                            </div>
                            {canDrop && (
                              <button
                                onClick={() => handleDropCourse(enrollment.id, enrollment.courseOffering.courseName)}
                                disabled={isDropping}
                                className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {isDropping ? 'Dropping...' : 'Drop Course'}
                              </button>
                            )}
                          </div>
                        </div>
                      }
                    />
                  )
                })}
              </div>
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

      <ConfirmModal
        isOpen={confirmDropModal.isOpen}
        title="Drop Course"
        message={`Are you sure you want to drop ${confirmDropModal.courseName}? This action cannot be undone.`}
        confirmText="Drop Course"
        cancelText="Cancel"
        onConfirm={confirmDropCourse}
        onCancel={cancelDropCourse}
        type="confirm"
      />

      <ConfirmModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        onConfirm={closeAlert}
        onCancel={closeAlert}
        type="alert"
      />
    </div>
  )
}
