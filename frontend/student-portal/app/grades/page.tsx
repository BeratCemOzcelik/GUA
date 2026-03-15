'use client'

import { useState, useEffect } from 'react'
import { gradesApi, academicTermsApi } from '@/lib/api'
import { EnrollmentWithGrades, AcademicTerm } from '@/lib/types'
import Link from 'next/link'

export default function GradesPage() {
  const [enrollmentsWithGrades, setEnrollmentsWithGrades] = useState<EnrollmentWithGrades[]>([])
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [selectedTerm, setSelectedTerm] = useState<number | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTerms()
  }, [])

  useEffect(() => {
    loadGrades()
  }, [selectedTerm])

  const loadTerms = async () => {
    try {
      const response = await academicTermsApi.getAll()
      setTerms(response.data)

      // Set current term as default
      const currentTerm = response.data.find((t: AcademicTerm) => t.isCurrent)
      if (currentTerm) {
        setSelectedTerm(currentTerm.id)
      }
    } catch (err: any) {
      console.error('Failed to load terms:', err)
    }
  }

  const loadGrades = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await gradesApi.getMyGrades(selectedTerm)

      // Map backend data to frontend format
      const mappedData = response.data.map((summary: any) => ({
        enrollment: {
          id: summary.enrollmentId,
          studentId: summary.studentId,
          courseOfferingId: summary.courseOfferingId,
          courseOffering: {
            id: summary.courseOfferingId,
            courseCode: summary.courseCode,
            courseName: summary.courseName,
            section: summary.section,
            termName: summary.termName,
            facultyName: summary.facultyName,
            credits: summary.credits,
          },
          enrollmentDate: '',
          status: summary.enrollmentStatus,
          finalGrade: summary.finalGrade?.letterGrade || null,
          gradePoint: summary.finalGrade?.gradePoints || null,
          enrollmentBlock: null,
        },
        gradeComponents: summary.componentGrades.map((cg: any) => ({
          id: cg.componentId,
          enrollmentId: summary.enrollmentId,
          componentName: cg.componentName,
          weightPercentage: cg.weight,
          maxScore: cg.maxScore,
          earnedScore: cg.grade?.score || null,
          isPublished: cg.isPublished,
          gradedAt: cg.grade?.gradedAt || null,
        })),
        weightedAverage: summary.currentWeightedAverage,
        finalLetterGrade: summary.finalGrade?.letterGrade || null,
      }))

      setEnrollmentsWithGrades(mappedData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load grades')
      console.error('Grades error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-gray-400'

    const gradeValue = grade.charAt(0)
    switch (gradeValue) {
      case 'A':
        return 'text-green-600'
      case 'B':
        return 'text-blue-600'
      case 'C':
        return 'text-amber-600'
      case 'D':
        return 'text-orange-600'
      case 'F':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Grades</h1>
        <p className="text-gray-600">View your grades and academic performance</p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Term
          </label>
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
      ) : enrollmentsWithGrades.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No grades found for the selected term.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Term
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Weighted Avg
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Final Grade
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enrollmentsWithGrades.map((item) => {
                const { enrollment, gradeComponents, weightedAverage, finalLetterGrade } = item
                const hasPublishedGrades = gradeComponents.some(g => g.isPublished)

                return (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {enrollment.courseOffering.courseCode}
                        </p>
                        <p className="text-xs text-gray-600">
                          {enrollment.courseOffering.courseName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {enrollment.courseOffering.termName}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">
                      {enrollment.courseOffering.credits}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {hasPublishedGrades ? (
                        weightedAverage !== null ? (
                          <span className="font-semibold text-gray-900">
                            {weightedAverage.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : (
                        <span className="text-xs text-amber-600">Not Published</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {finalLetterGrade ? (
                        <span className={`text-lg font-bold ${getGradeColor(finalLetterGrade)}`}>
                          {finalLetterGrade}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        enrollment.status === 'Enrolled' ? 'bg-green-100 text-green-700' :
                        enrollment.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/grades/${enrollment.id}`}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
