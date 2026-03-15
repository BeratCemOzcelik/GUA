'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface CourseOffering {
  id: number
  courseCode: string
  courseName: string
  section: string
  termName: string
  enrolledCount: number
}

export default function GradesPage() {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grade Management</h1>
        <p className="text-gray-600">
          Enter and manage grades for your courses
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">You are not assigned to any courses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/grades/${course.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {course.courseCode}
                  </h3>
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    {course.courseName}
                  </p>
                  <p className="text-xs text-gray-600">
                    Section {course.section} • {course.termName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-[#8B1A1A]">
                    {course.enrolledCount}
                  </p>
                </div>
                <div className="text-[#8B1A1A] font-semibold">
                  Enter Grades →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
