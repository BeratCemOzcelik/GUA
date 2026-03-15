'use client'

import { useState, useEffect } from 'react'
import { enrollmentsApi } from '@/lib/api'
import { CourseOffering } from '@/lib/types'
import CourseCard from '@/components/CourseCard'
import ConfirmModal from '@/components/ConfirmModal'

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    courseId: number | null
  }>({ isOpen: false, courseId: null })

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error'
  }>({ isOpen: false, title: '', message: '', type: 'success' })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await enrollmentsApi.getAvailable()
      setCourses(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses')
      console.error('Courses error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnroll = (courseOfferingId: number) => {
    setConfirmModal({ isOpen: true, courseId: courseOfferingId })
  }

  const confirmEnroll = async () => {
    if (!confirmModal.courseId) return

    setConfirmModal({ isOpen: false, courseId: null })

    try {
      setEnrollingCourseId(confirmModal.courseId)
      await enrollmentsApi.enroll(confirmModal.courseId)

      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Successfully enrolled in the course!',
        type: 'success'
      })
      loadCourses() // Reload to update capacity
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to enroll in course'
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error'
      })
      console.error('Enrollment error:', err)
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const cancelEnroll = () => {
    setConfirmModal({ isOpen: false, courseId: null })
  }

  const closeAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'success' })
  }

  const canEnroll = (course: CourseOffering) => {
    // Check if course is full
    if (course.enrolledCount >= course.capacity) {
      return { allowed: false, reason: 'Course is full' }
    }

    // Note: Prerequisites checking will be done by the backend
    // The backend will return an error if prerequisites are not met
    return { allowed: true, reason: '' }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Courses</h1>
        <p className="text-gray-600">Browse and enroll in courses for the current term</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No courses available for the selected filters.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => {
              const enrollCheck = canEnroll(course)
              const isEnrolling = enrollingCourseId === course.id

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  showPrerequisites={true}
                  action={
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={!enrollCheck.allowed || isEnrolling}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                        enrollCheck.allowed
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      } disabled:opacity-50`}
                      title={!enrollCheck.allowed ? enrollCheck.reason : ''}
                    >
                      {isEnrolling ? 'Enrolling...' : enrollCheck.allowed ? 'Enroll' : enrollCheck.reason}
                    </button>
                  }
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Confirm Enrollment Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Confirm Enrollment"
        message="Are you sure you want to enroll in this course?"
        confirmText="Enroll"
        cancelText="Cancel"
        onConfirm={confirmEnroll}
        onCancel={cancelEnroll}
        type="confirm"
      />

      {/* Success/Error Alert Modal */}
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
