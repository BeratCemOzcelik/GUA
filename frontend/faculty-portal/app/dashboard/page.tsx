'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrades: 0,
  })
  const [currentTerm, setCurrentTerm] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Get my courses and current term in parallel
      const [coursesRes, termRes] = await Promise.all([
        api.get('/courseofferings/my-courses?pageSize=1000'),
        api.get('/AcademicTerms/current')
      ])

      const data = coursesRes.data.data
      const courses = data?.items || []
      setCurrentTerm(termRes.data.data)

      let totalStudents = 0
      for (const course of courses) {
        totalStudents += course.enrolledCount || 0
      }

      setStats({
        totalCourses: data?.totalCount ?? courses.length,
        totalStudents: totalStudents,
        pendingGrades: 0,
      })
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err)
      console.error('Error details:', err.response?.data)
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Faculty Portal - Global University America
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Courses Teaching</p>
              <p className="text-4xl font-bold text-[#8B1A1A]">{stats.totalCourses}</p>
            </div>
            <div className="text-5xl">📚</div>
          </div>
          <Link href="/courses" className="text-sm text-[#8B1A1A] hover:underline">
            View courses →
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-4xl font-bold text-green-600">{stats.totalStudents}</p>
            </div>
            <div className="text-5xl">👥</div>
          </div>
          <Link href="/courses" className="text-sm text-green-600 hover:underline">
            View students →
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Grades</p>
              <p className="text-4xl font-bold text-amber-600">{stats.pendingGrades}</p>
            </div>
            <div className="text-5xl">📝</div>
          </div>
          <Link href="/grades" className="text-sm text-amber-600 hover:underline">
            Enter grades →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/courses"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-3xl">📚</span>
            <div>
              <p className="font-semibold text-gray-900">My Courses</p>
              <p className="text-xs text-gray-600">View teaching courses</p>
            </div>
          </Link>

          <Link
            href="/grades"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-3xl">📝</span>
            <div>
              <p className="font-semibold text-gray-900">Enter Grades</p>
              <p className="text-xs text-gray-600">Grade students</p>
            </div>
          </Link>

          <Link
            href="/materials"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-3xl">📁</span>
            <div>
              <p className="font-semibold text-gray-900">Course Materials</p>
              <p className="text-xs text-gray-600">Upload materials</p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-3xl">👤</span>
            <div>
              <p className="font-semibold text-gray-900">My Profile</p>
              <p className="text-xs text-gray-600">Update profile</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Current Term Info */}
      {currentTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Current Term</h3>
              <p className="text-sm text-blue-800">
                {currentTerm.name} ({currentTerm.code})
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Term: {new Date(currentTerm.startDate).toLocaleDateString()} - {new Date(currentTerm.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-blue-700">
                Enrollment: {new Date(currentTerm.enrollmentStartDate).toLocaleDateString()} - {new Date(currentTerm.enrollmentEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
