'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface CourseOffering {
  id: number
  courseId: number
  courseCode: string
  courseName: string
  termId: number
  termName: string
  section: string
  capacity: number
  enrolledCount: number
  availableSeats: number
  schedule?: string
  location?: string
  isActive: boolean
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMyCourses()
  }, [])

  const loadMyCourses = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await api.get('/courseofferings/my-courses')
      setCourses(response.data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses')
      console.error('Load courses error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">
          Courses you are teaching this term
        </p>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">You are not assigned to any courses yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Contact the administrator to get course assignments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Course Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {course.courseCode}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-[#8B1A1A]/10 text-[#8B1A1A] rounded-full">
                      Section {course.section}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{course.courseName}</p>
                  <p className="text-sm text-gray-600">{course.termName}</p>
                </div>
              </div>

              {/* Course Details */}
              <div className="space-y-2 mb-4">
                {course.schedule && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-24">Schedule:</span>
                    <span className="text-gray-900 font-medium">{course.schedule}</span>
                  </div>
                )}
                {course.location && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-24">Location:</span>
                    <span className="text-gray-900 font-medium">{course.location}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24">Enrollment:</span>
                  <span className="text-gray-900 font-medium">
                    {course.enrolledCount} / {course.capacity} students
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24">Status:</span>
                  <span className={`font-medium ${course.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <Link
                  href={`/courses/${course.id}`}
                  className="flex-1 px-4 py-2 bg-[#8B1A1A] text-white text-center rounded-lg font-semibold hover:bg-[#6B1414] transition-colors"
                >
                  View Details
                </Link>
                <Link
                  href={`/grades/${course.id}`}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-center rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Enter Grades
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
