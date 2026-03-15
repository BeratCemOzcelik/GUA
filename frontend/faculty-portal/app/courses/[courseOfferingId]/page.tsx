'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'

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

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseOfferingId = parseInt(params.courseOfferingId as string)

  const [courseInfo, setCourseInfo] = useState<CourseOffering | null>(null)
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourseData()
  }, [courseOfferingId])

  const loadCourseData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Load course offering info
      const courseRes = await api.get(`/courseofferings/${courseOfferingId}`)
      setCourseInfo(courseRes.data.data)

      // Load enrolled students
      const studentsRes = await api.get(`/enrollments/by-course-offering/${courseOfferingId}/students`)
      setStudents(studentsRes.data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course data')
      console.error('Load course data error:', err)
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
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-[#8B1A1A] hover:underline"
        >
          ← Go Back
        </button>
      </div>
    )
  }

  if (!courseInfo) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
        Course not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-[#8B1A1A] hover:underline"
      >
        <span className="mr-2">←</span>
        Back to My Courses
      </button>

      {/* Course Header */}
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
            <p className="text-xs text-gray-600">{students.length} enrolled</p>
          </div>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Enrolled Students</h2>

        {students.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No students enrolled yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Student Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Final Grade
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.enrollmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {student.studentNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.email}
                    </td>
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
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        student.status === 'Enrolled'
                          ? 'bg-green-100 text-green-700'
                          : student.status === 'Dropped'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
