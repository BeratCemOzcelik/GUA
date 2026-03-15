'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { gradesApi, enrollmentsApi } from '@/lib/api'
import { GradeComponent, Enrollment } from '@/lib/types'
import GradeTable from '@/components/GradeTable'

export default function EnrollmentGradesPage() {
  const params = useParams()
  const router = useRouter()
  const enrollmentId = parseInt(params.enrollmentId as string)

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([])
  const [weightedAverage, setWeightedAverage] = useState<number | null>(null)
  const [finalGrade, setFinalGrade] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGradeDetails()
  }, [enrollmentId])

  const loadGradeDetails = async () => {
    try {
      setIsLoading(true)
      setError('')

      const [enrollmentRes, gradesRes] = await Promise.all([
        enrollmentsApi.getById(enrollmentId),
        gradesApi.getEnrollmentGrades(enrollmentId)
      ])

      // Map backend data to frontend format
      const enrollmentData = enrollmentRes.data
      const mappedEnrollment = {
        ...enrollmentData,
        courseOffering: {
          id: enrollmentData.courseOfferingId,
          courseCode: enrollmentData.courseCode,
          courseName: enrollmentData.courseName,
          section: enrollmentData.section,
          termName: enrollmentData.termName,
          facultyName: enrollmentData.facultyName,
          schedule: enrollmentData.schedule,
          location: enrollmentData.location,
          credits: enrollmentData.credits,
        }
      }

      setEnrollment(mappedEnrollment)

      // Map backend componentGrades to frontend GradeComponent format
      const rawComponents = gradesRes.data.componentGrades || gradesRes.data.gradeComponents || []
      const mapped = rawComponents.map((c: any) => ({
        id: c.componentId || c.id,
        enrollmentId: enrollmentId,
        componentName: c.componentName,
        weightPercentage: c.weight,
        maxScore: c.maxScore,
        earnedScore: c.grade?.score ?? null,
        isPublished: c.isPublished,
        gradedAt: c.grade?.gradedAt ?? null,
      }))
      setGradeComponents(mapped)
      setWeightedAverage(gradesRes.data.currentWeightedAverage ?? gradesRes.data.weightedAverage ?? null)
      setFinalGrade(gradesRes.data.finalLetterGrade ?? gradesRes.data.finalGrade?.letterGrade ?? null)

      // If no final grade from grades endpoint, check final grades endpoint
      if (!gradesRes.data.finalLetterGrade && !gradesRes.data.finalGrade) {
        try {
          const fgRes = await gradesApi.getFinalGrade(enrollmentId)
          if (fgRes.data) {
            setFinalGrade(fgRes.data.letterGrade)
          }
        } catch {} // No final grade yet, that's ok
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load grade details')
      console.error('Grade details error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateGradePoint = (grade: string | null) => {
    if (!grade) return null

    const gradePoints: { [key: string]: number } = {
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D': 1.0,
      'F': 0.0,
    }

    return gradePoints[grade] || null
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
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-primary hover:underline"
        >
          ← Go Back
        </button>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
        Enrollment not found.
      </div>
    )
  }

  const gradePoint = calculateGradePoint(finalGrade)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-primary hover:underline"
      >
        <span className="mr-2">←</span>
        Back to Grades
      </button>

      {/* Course Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {enrollment.courseOffering.courseCode} - {enrollment.courseOffering.courseName}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Term: {enrollment.courseOffering.termName}</span>
              <span>•</span>
              <span>Section: {enrollment.courseOffering.section}</span>
              <span>•</span>
              <span>Credits: {enrollment.courseOffering.credits}</span>
              {enrollment.courseOffering.facultyName && (
                <>
                  <span>•</span>
                  <span>Faculty: {enrollment.courseOffering.facultyName}</span>
                </>
              )}
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            enrollment.status === 'Enrolled' ? 'bg-green-100 text-green-700' :
            enrollment.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {enrollment.status}
          </span>
        </div>

        {/* Final Grade Display */}
        {finalGrade && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Final Grade</p>
              <p className={`text-4xl font-bold ${
                finalGrade.startsWith('A') ? 'text-green-600' :
                finalGrade.startsWith('B') ? 'text-blue-600' :
                finalGrade.startsWith('C') ? 'text-amber-600' :
                finalGrade.startsWith('D') ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {finalGrade}
              </p>
            </div>
            {gradePoint !== null && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Grade Point</p>
                <p className="text-4xl font-bold text-gray-900">{gradePoint.toFixed(1)}</p>
              </div>
            )}
            {weightedAverage !== null && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Weighted Average</p>
                <p className="text-4xl font-bold text-gray-900">{weightedAverage.toFixed(2)}%</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grade Components */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Grade Components</h2>
        <GradeTable
          gradeComponents={gradeComponents}
          showWeightedAverage={!finalGrade}
          weightedAverage={weightedAverage}
        />
      </div>

      {/* Grade Calculation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How Grades Are Calculated</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Each component is weighted according to its percentage</p>
          <p>• Your weighted average is calculated from all graded components</p>
          <p>• Final letter grades are assigned once all components are graded and published</p>
          <p>• Only published grades are visible to students</p>
        </div>
      </div>

      {/* Grading Scale */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Grading Scale</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { grade: 'A', range: '90-100', points: '4.0', color: 'text-green-600' },
            { grade: 'B', range: '80-89', points: '3.0', color: 'text-blue-600' },
            { grade: 'C', range: '70-79', points: '2.0', color: 'text-amber-600' },
            { grade: 'D', range: '60-69', points: '1.0', color: 'text-orange-600' },
            { grade: 'F', range: '0-59', points: '0.0', color: 'text-red-600' },
          ].map((item) => (
            <div key={item.grade} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${item.color}`}>{item.grade}</p>
              <p className="text-xs text-gray-600 mt-1">{item.range}%</p>
              <p className="text-xs text-gray-500">{item.points} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
