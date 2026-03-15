'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Submission {
  id: number
  enrollmentId: number
  gradeComponentId: number
  gradeComponentName: string
  studentName?: string
  studentNumber?: string
  submittedAt: string
  fileName: string
  fileUrl: string
  fileSize: number
  status: string
  statusText: string
  score?: number
  facultyComments?: string
  maxScore: number
}

export default function SubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const componentId = parseInt(params.componentId as string)

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [componentInfo, setComponentInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSubmissions()
  }, [componentId])

  const loadSubmissions = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Load component info
      const compRes = await api.get(`/GradeComponents/${componentId}`)
      setComponentInfo(compRes.data.data)

      // Load submissions
      const subRes = await api.get(`/AssignmentSubmissions/grade-component/${componentId}`)
      const submissionsData = subRes.data.data || []

      // Load student info for each submission
      for (const sub of submissionsData) {
        try {
          const enrollmentRes = await api.get(`/Enrollments/${sub.enrollmentId}`)
          const enrollment = enrollmentRes.data.data

          if (enrollment) {
            sub.studentName = enrollment.studentName || 'Unknown'
            sub.studentNumber = enrollment.studentNumber || 'N/A'
          }
        } catch (err) {
          console.error(`Failed to load enrollment ${sub.enrollmentId}`, err)
        }
      }

      setSubmissions(submissionsData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load submissions')
      console.error('Load submissions error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'graded':
        return 'bg-green-100 text-green-700'
      case 'submitted':
        return 'bg-blue-100 text-blue-700'
      case 'late':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
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
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center text-[#8B1A1A] hover:underline mb-4">
          <span className="mr-2">←</span>
          Back to Grade Entry
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Submissions</h1>
        {componentInfo && (
          <div className="text-gray-600">
            <p className="font-medium">{componentInfo.name}</p>
            <p className="text-sm">
              {componentInfo.courseCode} - {componentInfo.courseName} | Section {componentInfo.section} | {componentInfo.termName}
            </p>
            <p className="text-sm mt-1">
              Max Score: {componentInfo.maxScore} points | Weight: {componentInfo.weight}%
              {componentInfo.dueDate && ` | Due: ${new Date(componentInfo.dueDate).toLocaleString()}`}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Submissions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Submissions ({submissions.length})
        </h2>

        {submissions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{submission.studentName || 'Unknown Student'}</h3>
                    <p className="text-sm text-gray-600">{submission.studentNumber || 'N/A'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {submission.statusText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">File:</span>
                    <p className="font-medium text-gray-900">{submission.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <p className="font-medium text-gray-900">{(submission.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <p className="font-medium text-gray-900">{new Date(submission.submittedAt).toLocaleString()}</p>
                  </div>
                  {submission.score !== null && submission.score !== undefined && (
                    <div>
                      <span className="text-gray-600">Grade:</span>
                      <p className="font-medium text-green-600">
                        {submission.score}/{submission.maxScore} ({((submission.score / submission.maxScore) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  )}
                </div>

                {submission.facultyComments && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-blue-900 mb-1">Faculty Comments:</p>
                    <p className="text-sm text-blue-800">{submission.facultyComments}</p>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}/files/download?fileUrl=${encodeURIComponent(submission.fileUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#8B1A1A] text-white rounded-lg text-sm font-semibold hover:bg-[#6B1414] transition-colors"
                  >
                    📥 Download Submission
                  </a>
                  <button
                    onClick={() => {
                      // Navigate to grade entry page and focus on this student
                      router.push(`/grades/${componentInfo.courseOfferingId}`)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Enter Grade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Grading Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Download each submission to review the student's work</li>
              <li>• Return to the Grade Entry page to enter scores</li>
              <li>• Grades can be entered in the grade entry table</li>
              <li>• You can add comments when entering grades</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
