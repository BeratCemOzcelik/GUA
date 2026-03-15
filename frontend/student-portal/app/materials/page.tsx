'use client'

import { useState, useEffect } from 'react'
import { enrollmentsApi } from '@/lib/api'
import { Enrollment } from '@/lib/types'
import Link from 'next/link'

export default function MaterialsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEnrollments()
  }, [])

  const loadEnrollments = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await enrollmentsApi.getMyEnrollments()

      // Map backend data to frontend format
      const mappedEnrollments = response.data.map((enrollment: any) => ({
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
        }
      }))

      setEnrollments(mappedEnrollments.filter((e: any) => e.status === 'Enrolled'))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses')
      console.error('Materials error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Materials</h1>
        <p className="text-gray-600">Access course materials and submit assignments</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">You are not enrolled in any courses.</p>
          <p className="text-sm text-gray-500 mt-2">
            Visit the <Link href="/courses" className="text-primary hover:underline">Courses</Link> page to enroll.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {enrollment.courseOffering.courseCode} - {enrollment.courseOffering.courseName}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <span>Section: {enrollment.courseOffering.section}</span>
                    <span>•</span>
                    <span>Term: {enrollment.courseOffering.termName}</span>
                    {enrollment.courseOffering.facultyName && (
                      <>
                        <span>•</span>
                        <span>Faculty: {enrollment.courseOffering.facultyName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href={`/materials/${enrollment.courseOffering.id}`}
                className="inline-block px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                View Materials & Assignments
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
