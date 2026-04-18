'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, enrollmentsApi, gradesApi, courseMaterialsApi } from '@/lib/api'
import { CourseMaterial } from '@/lib/types'
import Link from 'next/link'

interface GradeComponentWithSubmission {
  id: number
  name: string
  type: string
  weight: number
  maxScore: number
  dueDate: string | null
  isPublished: boolean
  // Assignment-specific (not all components are assignments)
  isAssignment: boolean
  submission: any | null
}

export default function CourseOfferingMaterialsPage() {
  const params = useParams()
  const router = useRouter()
  const courseOfferingId = parseInt(params.courseOfferingId as string)

  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([])
  const [gradeComponents, setGradeComponents] = useState<GradeComponentWithSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null)

  useEffect(() => {
    loadMaterialsAndAssignments()
  }, [courseOfferingId])

  const loadMaterialsAndAssignments = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Get enrollment to get course info
      console.log('Fetching enrollments...')
      const enrollmentsRes = await enrollmentsApi.getMyEnrollments({ pageSize: 1000 })
      console.log('Enrollments:', enrollmentsRes.data)
      const enrollment = (enrollmentsRes.data?.items || []).find((e: any) => e.courseOfferingId === courseOfferingId)
      console.log('Found enrollment:', enrollment)

      if (!enrollment) {
        setError('You are not enrolled in this course')
        setIsLoading(false)
        return
      }

      setCourseInfo({
        courseCode: enrollment.courseCode,
        courseName: enrollment.courseName,
        section: enrollment.section,
        termName: enrollment.termName,
        facultyName: enrollment.facultyName,
      })

      // Load course materials
      try {
        console.log('Fetching course materials for offering:', courseOfferingId)
        const materialsRes = await courseMaterialsApi.getByCourseOffering(courseOfferingId)
        console.log('Materials response:', materialsRes)
        setCourseMaterials(materialsRes.data || [])
      } catch (err) {
        console.error('Failed to load course materials:', err)
        // Don't fail the whole page if materials can't be loaded
      }

      // Get grade components (includes assignments)
      try {
        console.log('Fetching grades for enrollment:', enrollment.id)
        const gradesRes = await gradesApi.getEnrollmentGrades(enrollment.id)
        console.log('Grades response:', gradesRes)

        // Map to include assignment info - note: ComponentGrades not gradeComponents
        const gradeComponentsData = gradesRes.data?.componentGrades || []
        const components = gradeComponentsData.map((comp: any) => ({
          id: comp.componentId,
          name: comp.componentName,
          type: comp.componentType,
          weight: comp.weight,
          maxScore: comp.maxScore,
          dueDate: comp.dueDate,
          isPublished: comp.isPublished,
          // All grade components can now accept file submissions
          isAssignment: true,
          submission: null, // Will be loaded separately
        }))

        setGradeComponents(components)

        // Load submissions for assignments
        try {
          const submissionsRes = await api.get(`/AssignmentSubmissions/my-submissions?courseOfferingId=${courseOfferingId}`)
          const submissions = submissionsRes.data.data || []

          // Map submissions to components
          const componentsWithSubmissions = components.map((comp: any) => {
            const submission = submissions.find((s: any) => s.gradeComponentId === comp.id)
            return {
              ...comp,
              submission: submission || null
            }
          })

          setGradeComponents(componentsWithSubmissions)
        } catch (err) {
          console.error('Failed to load submissions:', err)
          // Continue without submissions
        }
      } catch (err) {
        console.error('Failed to load grades/assignments:', err)
        // Don't fail the whole page if grades can't be loaded
        setGradeComponents([])
      }
    } catch (err: any) {
      console.error('Materials page error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load materials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (componentId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // File size check (10MB)
    if (file.size > 10485760) {
      alert('File size exceeds 10MB limit')
      return
    }

    try {
      setUploading(true)

      // Upload file first
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'assignments')

      const uploadRes = await api.post('/Files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const fileUrl = uploadRes.data.data.fileUrl

      // Submit assignment
      const submissionPayload = {
        gradeComponentId: componentId,
        fileUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        studentComments: '' // Could add a comment field later
      }

      console.log('Submitting assignment:', submissionPayload)
      await api.post('/AssignmentSubmissions', submissionPayload)

      alert('Assignment submitted successfully!')

      // Reload the page to show updated submission
      loadMaterialsAndAssignments()
    } catch (err: any) {
      console.error('Upload error:', err)
      console.error('Error response:', err.response)
      const errorMsg = err.response?.data?.message
        || err.response?.data?.errors
        || err.message
        || 'Failed to submit assignment'
      alert(`Error: ${JSON.stringify(errorMsg)}`)
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (component: GradeComponentWithSubmission) => {
    if (component.submission?.status === 'Graded') {
      return <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">✅ Graded</span>
    }
    if (component.submission?.status === 'Submitted') {
      return <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-700">✅ Submitted</span>
    }
    if (component.submission?.status === 'Late') {
      return <span className="text-xs px-3 py-1 rounded-full font-medium bg-orange-100 text-orange-700">🟡 Late</span>
    }
    if (component.dueDate && new Date(component.dueDate) < new Date()) {
      return <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">❌ Overdue</span>
    }
    return <span className="text-xs px-3 py-1 rounded-full font-medium bg-amber-100 text-amber-700">🟡 Pending</span>
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-primary hover:underline"
      >
        <span className="mr-2">←</span>
        Back to Materials
      </button>

      {/* Course Header */}
      {courseInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {courseInfo.courseCode} - {courseInfo.courseName}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Section: {courseInfo.section}</span>
            <span>•</span>
            <span>Term: {courseInfo.termName}</span>
            {courseInfo.facultyName && (
              <>
                <span>•</span>
                <span>Faculty: {courseInfo.facultyName}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Course Materials Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Course Materials</h2>
        {courseMaterials.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-blue-800">No course materials uploaded yet.</p>
            <p className="text-xs text-blue-600 mt-1">Faculty can upload lecture notes, slides, and other resources.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courseMaterials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">
                        {material.fileType.toLowerCase().includes('pdf') ? '📄' :
                         material.fileType.toLowerCase().includes('ppt') || material.fileType.toLowerCase().includes('pptx') ? '📊' :
                         material.fileType.toLowerCase().includes('doc') ? '📝' :
                         material.fileType.toLowerCase().includes('xls') ? '📗' :
                         material.fileType.toLowerCase().includes('zip') ? '📦' :
                         material.fileType.toLowerCase().includes('jpg') || material.fileType.toLowerCase().includes('jpeg') || material.fileType.toLowerCase().includes('png') ? '🖼️' :
                         '📁'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{material.title}</h3>
                    {material.description && (
                      <p className="text-xs text-gray-600 truncate">{material.description}</p>
                    )}
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-500">{material.fileType.toUpperCase()}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">v{material.version}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{new Date(material.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/files/download?fileUrl=${encodeURIComponent(material.fileUrl)}`}
                  className="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grade Components Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Grade Components & Submissions</h2>

        {gradeComponents.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No grade components available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gradeComponents.map((assignment) => (
              <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{assignment.name}</h3>
                      {getStatusBadge(assignment)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Max Score: {assignment.maxScore} points</span>
                      <span>•</span>
                      <span>Weight: {assignment.weight}%</span>
                      {assignment.dueDate && (
                        <>
                          <span>•</span>
                          <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {assignment.submission ? (
                  // Already submitted
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 mb-2">Submission Details:</p>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>File: {assignment.submission.fileName} ({(assignment.submission.fileSize / 1024 / 1024).toFixed(2)} MB)</p>
                      <p>Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}</p>
                      <p>Status: {assignment.submission.statusText || assignment.submission.status}</p>
                      {assignment.submission.score !== null && assignment.submission.score !== undefined && (
                        <p className="font-bold">Grade: {assignment.submission.score}/{assignment.maxScore} ({((assignment.submission.score / assignment.maxScore) * 100).toFixed(1)}%)</p>
                      )}
                      {assignment.submission.facultyComments && (
                        <p className="mt-2 italic">Faculty Comments: &ldquo;{assignment.submission.facultyComments}&rdquo;</p>
                      )}
                    </div>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/files/download?fileUrl=${encodeURIComponent(assignment.submission.fileUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-green-700 hover:underline"
                    >
                      Download Submission
                    </a>
                  </div>
                ) : (
                  // Not submitted yet
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <label
                        htmlFor={`file-upload-${assignment.id}`}
                        className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        📎 Choose File (Max 10MB)
                      </label>
                      <input
                        id={`file-upload-${assignment.id}`}
                        type="file"
                        onChange={(e) => handleFileUpload(assignment.id, e)}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-500">All file types accepted</span>
                    </div>

                    {assignment.dueDate && new Date(assignment.dueDate) < new Date() && (
                      <p className="text-sm text-red-600">
                        ⚠️ This assignment is overdue. Late submissions will be marked as &ldquo;Late&rdquo;.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
