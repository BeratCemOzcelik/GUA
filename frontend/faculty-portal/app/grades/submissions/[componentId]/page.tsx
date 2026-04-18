'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'

interface Submission {
  id: number
  enrollmentId: number
  gradeComponentId: number
  gradeComponentName: string
  studentName: string
  studentNumber: string
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

const STATUS_OPTIONS = ['Submitted', 'Late', 'Graded']

export default function SubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const componentId = parseInt(params.componentId as string)

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [componentInfo, setComponentInfo] = useState<any>(null)

  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadComponentInfo()
  }, [componentId])

  useEffect(() => {
    loadSubmissions()
  }, [componentId, status, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [status, search, pageSize])

  const loadComponentInfo = async () => {
    try {
      const res = await api.get(`/GradeComponents/${componentId}`)
      setComponentInfo(res.data.data)
    } catch (err) {
      console.error('Failed to load component info', err)
    }
  }

  const loadSubmissions = async () => {
    try {
      setIsLoading(true)
      setError('')

      const qs = new URLSearchParams()
      if (status) qs.append('status', status)
      if (search) qs.append('search', search)
      qs.append('page', page.toString())
      qs.append('pageSize', pageSize.toString())

      const res = await api.get(`/AssignmentSubmissions/grade-component/${componentId}?${qs.toString()}`)
      const data = res.data.data
      setSubmissions(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by student name or number..."
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
      )}

      {/* Submissions */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Submissions ({totalCount})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No submissions found.</p>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
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
                      onClick={() => router.push(`/grades/${componentInfo?.courseOfferingId}`)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Enter Grade
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </div>
  )
}
