'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { studentProfileApi, enrollmentsApi } from '@/lib/api'
import { StudentProfile, Enrollment } from '@/lib/types'
import StatCard from '@/components/StatCard'
import CourseCard from '@/components/CourseCard'

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Load student profile and current enrollments
      const [profileRes, enrollmentsRes] = await Promise.all([
        studentProfileApi.getMyProfile(),
        enrollmentsApi.getMyEnrollments({ status: 'Enrolled', pageSize: 1000 })
      ])

      setProfile(profileRes.data)

      // Map backend data to frontend format (add courseOffering nested object)
      const mappedEnrollments = (enrollmentsRes.data?.items || []).map((enrollment: any) => ({
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

      setEnrollments(mappedEnrollments)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data')
      console.error('Dashboard error:', err)
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

  if (!profile) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
        Profile not found. Please contact the registrar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile.firstName}!
        </h1>
        <p className="text-gray-600">
          Student Number: <span className="font-semibold">{profile.studentNumber}</span> | Program: <span className="font-semibold">{profile.programName}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current GPA"
          value={profile.currentGPA != null ? profile.currentGPA.toFixed(2) : 'N/A'}
          icon="🎯"
          color="primary"
        />
        <StatCard
          title="Total Credits Earned"
          value={profile.totalCreditsEarned || 0}
          icon="📚"
          color="green"
        />
        <StatCard
          title="Courses in Progress"
          value={enrollments.length}
          icon="📖"
          color="blue"
        />
        <StatCard
          title="Expected Graduation"
          value={profile.expectedGraduationDate ? new Date(profile.expectedGraduationDate).getFullYear() : 'N/A'}
          icon="🎓"
          color="amber"
        />
      </div>

      {/* Current Enrollments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Current Enrollments</h2>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">You are not currently enrolled in any courses.</p>
            <p className="text-sm text-gray-500 mt-2">
              Visit your <a href="/program-plan" className="text-primary hover:underline">Program Plan</a> to start a course.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {enrollments.map((enrollment) => (
              <CourseCard
                key={enrollment.id}
                course={enrollment.courseOffering}
                action={
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      Enrolled
                    </span>
                    <a
                      href={`/grades/${enrollment.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      View Grades
                    </a>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/program-plan"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">🗺️</span>
            <div>
              <p className="font-semibold text-gray-900">Program Plan</p>
              <p className="text-xs text-gray-600">Start a course or check progress</p>
            </div>
          </a>
          <a
            href="/grades"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📝</span>
            <div>
              <p className="font-semibold text-gray-900">View Grades</p>
              <p className="text-xs text-gray-600">Check your performance</p>
            </div>
          </a>
          <a
            href="/transcript"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📜</span>
            <div>
              <p className="font-semibold text-gray-900">Transcript</p>
              <p className="text-xs text-gray-600">View academic record</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
