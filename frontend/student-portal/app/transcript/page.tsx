'use client'

import { useState, useEffect } from 'react'
import { transcriptApi } from '@/lib/api'
import { TranscriptData } from '@/lib/types'

export default function TranscriptPage() {
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadTranscript()
  }, [])

  const loadTranscript = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await transcriptApi.getMyTranscript()
      setTranscriptData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transcript')
      console.error('Transcript error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateTranscript = async () => {
    if (!confirm('Generate an official transcript snapshot? This will create a permanent record of your current academic standing.')) {
      return
    }

    try {
      setIsGenerating(true)
      await transcriptApi.generate()
      alert('Transcript generated successfully! You can view it in the history.')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate transcript'
      alert(errorMessage)
      console.error('Generate transcript error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const getGradeColor = (grade: string) => {
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

  if (!transcriptData) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
        No transcript data available.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Transcript</h1>
          <p className="text-gray-600">Official record of your academic performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/transcript/history"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            View History
          </a>
        </div>
      </div>

      {/* Student Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-semibold text-gray-900">
              {transcriptData.student.fullName || `${(transcriptData.student as any).firstName || ''} ${(transcriptData.student as any).lastName || ''}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Student Number</p>
            <p className="font-semibold text-gray-900">{transcriptData.student.studentNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Program</p>
            <p className="font-semibold text-gray-900">{transcriptData.student.programName || (transcriptData.student as any).programName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Enrollment Date</p>
            <p className="font-semibold text-gray-900">
              {transcriptData.student.enrollmentDate
                ? new Date(transcriptData.student.enrollmentDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Cumulative Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Cumulative GPA</p>
          <p className="text-5xl font-bold text-primary">
            {(transcriptData.gpaSummary?.currentGPA ?? transcriptData.cumulativeGPA) != null
              ? (transcriptData.gpaSummary?.currentGPA ?? transcriptData.cumulativeGPA ?? 0).toFixed(2)
              : 'N/A'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Credits Earned</p>
          <p className="text-5xl font-bold text-green-600">{transcriptData.gpaSummary?.totalCreditsEarned || transcriptData.totalCreditsEarned || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Credits Attempted</p>
          <p className="text-5xl font-bold text-gray-900">{transcriptData.gpaSummary?.totalCreditsAttempted || transcriptData.totalCreditsAttempted || 0}</p>
        </div>
      </div>

      {/* Academic Record by Term */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Academic Record</h2>

        {transcriptData.termRecords.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No academic records found.</p>
          </div>
        ) : (
          transcriptData.termRecords.map((termRecord) => (
            <div key={termRecord.termCode || termRecord.termName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Term Header */}
              <div className="bg-primary/5 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{termRecord.termName}</h3>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-right">
                      <p className="text-gray-600">Term GPA</p>
                      <p className="font-bold text-gray-900">
                        {termRecord.termGPA != null ? termRecord.termGPA.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Term Credits</p>
                      <p className="font-bold text-gray-900">{termRecord.termCredits ?? 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Cumulative GPA</p>
                      <p className="font-bold text-gray-900">
                        {termRecord.cumulativeGPA != null ? termRecord.cumulativeGPA.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses Table */}
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Grade Point
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {termRecord.courses.map((course, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {course.courseCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.courseName}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">
                        {course.credits}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-bold ${getGradeColor(course.letterGrade || course.grade || 'N/A')}`}>
                          {course.letterGrade || course.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900">
                        {(course.gradePoints ?? course.gradePoint) != null ? (course.gradePoints ?? course.gradePoint ?? 0).toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Grading Scale</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="font-bold text-green-600">A (4.0)</span> - 90-100%
          </div>
          <div>
            <span className="font-bold text-blue-600">B (3.0)</span> - 80-89%
          </div>
          <div>
            <span className="font-bold text-amber-600">C (2.0)</span> - 70-79%
          </div>
          <div>
            <span className="font-bold text-orange-600">D (1.0)</span> - 60-69%
          </div>
          <div>
            <span className="font-bold text-red-600">F (0.0)</span> - 0-59%
          </div>
        </div>
      </div>

      {/* Official Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Official Transcript:</span> This is an unofficial view of your academic record.
          Official transcripts are generated by the registrar&apos;s office. You can view previously issued transcripts from the history page.
        </p>
      </div>
    </div>
  )
}
