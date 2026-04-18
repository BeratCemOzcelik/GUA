'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'

interface GradeComponent {
  id: number
  name: string
  type: string
  typeText: string
  weight: number
  maxScore: number
  dueDate?: string
  isPublished: boolean
}

interface StudentGrade {
  enrollmentId: number
  studentNumber: string
  studentName: string
  gradeComponents: {
    componentId: number
    score?: number
    gradeId?: number
  }[]
  finalLetterGrade?: string
  finalNumericGrade?: number
}

const STATUS_OPTIONS = ['Enrolled', 'Dropped', 'Completed', 'Withdrawn']

export default function GradeEntryPage() {
  const params = useParams()
  const router = useRouter()
  const courseOfferingIdRaw = parseInt(params.courseOfferingId as string)
  const courseOfferingId = Number.isFinite(courseOfferingIdRaw) ? courseOfferingIdRaw : 0
  const isValidCourseId = courseOfferingId > 0

  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([])
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [statusFilter, setStatusFilter] = useState('Enrolled')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [componentForm, setComponentForm] = useState({
    name: '',
    type: 'Assignment',
    weight: '',
    maxScore: '',
    dueDate: '',
    isPublished: true,
  })

  // Initial load: course info + grade components (these don't depend on pagination)
  useEffect(() => {
    if (!isValidCourseId) return
    loadCourseAndComponents()
  }, [courseOfferingId, isValidCourseId])

  // Paginated student grades reload
  useEffect(() => {
    if (gradeComponents.length === 0) return
    loadStudentGrades()
  }, [courseOfferingId, statusFilter, search, page, pageSize, gradeComponents])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search, pageSize])

  const loadCourseAndComponents = async () => {
    try {
      setError('')
      const [courseRes, componentsRes] = await Promise.all([
        api.get(`/CourseOfferings/${courseOfferingId}`),
        api.get(`/GradeComponents/by-course-offering/${courseOfferingId}`),
      ])
      setCourseInfo(courseRes.data.data)
      setGradeComponents(componentsRes.data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course data')
    }
  }

  const loadStudentGrades = async () => {
    try {
      setIsLoading(true)
      setError('')

      const qs = new URLSearchParams()
      if (statusFilter) qs.append('status', statusFilter)
      if (search) qs.append('search', search)
      qs.append('page', page.toString())
      qs.append('pageSize', pageSize.toString())

      // Single aggregated call for all grades in this course — replaces N+1 per-student fetch.
      const [studentsRes, allGradesRes] = await Promise.all([
        api.get(`/Enrollments/by-course-offering/${courseOfferingId}/students?${qs.toString()}`),
        api.get(`/Grades?courseOfferingId=${courseOfferingId}`),
      ])

      const studentsData = studentsRes.data.data
      const students = studentsData?.items || []
      setTotalCount(studentsData?.totalCount || 0)

      // Build (enrollmentId, componentId) → {score, gradeId} index
      const allGrades: any[] = allGradesRes.data?.data || []
      const gradeIndex = new Map<string, { score: number; gradeId: number }>()
      for (const g of allGrades) {
        gradeIndex.set(`${g.enrollmentId}:${g.gradeComponentId}`, { score: g.score, gradeId: g.id })
      }

      const studentGradesData: StudentGrade[] = students.map((student: any) => {
        return {
          enrollmentId: student.enrollmentId,
          studentNumber: student.studentNumber,
          studentName: `${student.firstName} ${student.lastName}`,
          gradeComponents: gradeComponents.map((comp) => {
            const existing = gradeIndex.get(`${student.enrollmentId}:${comp.id}`)
            return {
              componentId: comp.id,
              score: existing?.score,
              gradeId: existing?.gradeId,
            }
          }),
          finalLetterGrade: student.finalLetterGrade,
          finalNumericGrade: student.finalNumericGrade,
        }
      })

      setStudentGrades(studentGradesData)
      setHasUnsavedChanges(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student grades')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScoreChange = (enrollmentId: number, componentId: number, value: string) => {
    setHasUnsavedChanges(true)
    setStudentGrades((prev) =>
      prev.map((student) => {
        if (student.enrollmentId === enrollmentId) {
          return {
            ...student,
            gradeComponents: student.gradeComponents.map((comp) =>
              comp.componentId === componentId
                ? { ...comp, score: value === '' ? undefined : parseFloat(value) }
                : comp
            ),
          }
        }
        return student
      })
    )
  }

  const confirmPageChange = (): boolean => {
    if (!hasUnsavedChanges) return true
    return window.confirm('You have unsaved grade changes. Leave this page anyway?')
  }

  const handlePageChange = (newPage: number) => {
    if (confirmPageChange()) setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (confirmPageChange()) setPageSize(newPageSize)
  }

  const handleCreateComponent = async () => {
    try {
      setIsCreating(true)
      setError('')
      setSuccess('')

      if (!componentForm.name || !componentForm.weight || !componentForm.maxScore) {
        setError('Please fill in all required fields')
        return
      }

      const weight = parseFloat(componentForm.weight)
      const maxScore = parseFloat(componentForm.maxScore)

      if (weight <= 0 || weight > 100) {
        setError('Weight must be between 0 and 100')
        return
      }

      if (maxScore <= 0) {
        setError('Max score must be greater than 0')
        return
      }

      const payload = {
        courseOfferingId,
        name: componentForm.name,
        type: componentForm.type,
        weight,
        maxScore,
        dueDate: componentForm.dueDate ? new Date(componentForm.dueDate).toISOString() : null,
        isPublished: componentForm.isPublished,
      }

      await api.post('/GradeComponents', payload)

      setSuccess('Grade component created successfully!')
      setShowCreateModal(false)
      setComponentForm({
        name: '',
        type: 'Assignment',
        weight: '',
        maxScore: '',
        dueDate: '',
        isPublished: true,
      })
      await loadCourseAndComponents()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create grade component')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveGrades = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Group entered scores by component; backend's /Grades/bulk handles create-or-update atomically per component.
      const byComponent = new Map<number, { enrollmentId: number; score: number }[]>()
      for (const student of studentGrades) {
        for (const comp of student.gradeComponents) {
          if (comp.score !== undefined && comp.score !== null && !Number.isNaN(comp.score)) {
            if (!byComponent.has(comp.componentId)) byComponent.set(comp.componentId, [])
            byComponent.get(comp.componentId)!.push({
              enrollmentId: student.enrollmentId,
              score: comp.score,
            })
          }
        }
      }

      if (byComponent.size === 0) {
        setSuccess('No scores to save.')
        return
      }

      // Fire one bulk POST per component in parallel. allSettled so partial failures don't hide successes.
      const results = await Promise.allSettled(
        Array.from(byComponent.entries()).map(([gradeComponentId, studentGradesList]) =>
          api.post('/Grades/bulk', {
            gradeComponentId,
            studentGrades: studentGradesList,
          })
        )
      )

      // Two failure modes to surface:
      //  (a) HTTP error → Promise.allSettled rejected
      //  (b) Backend returned 200 OK but embedded an error summary in message
      //      (`/Grades/bulk` returns 200 even with per-student failures — see GradesController)
      const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
      const partialFailures = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value?.data?.message as string | undefined)
        .filter((m): m is string => !!m && /error/i.test(m))

      if (rejected.length > 0 || partialFailures.length > 0) {
        const rejectedMessages = rejected
          .map((r: any) => r.reason?.response?.data?.message || r.reason?.message)
          .filter(Boolean)
        const allMessages = [...rejectedMessages, ...partialFailures].join(' | ')
        const summary = rejected.length > 0
          ? `${rejected.length} of ${results.length} save(s) failed.`
          : 'Grades saved with issues.'
        setError(`${summary} ${allMessages}`.trim())
      } else {
        setSuccess('Grades saved successfully!')
      }

      setHasUnsavedChanges(false)
      await loadStudentGrades()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const handlePublishFinalGrades = async () => {
    try {
      setIsPublishing(true)
      setError('')
      setSuccess('')

      await api.post(`/FinalGrades/courseoffering/${courseOfferingId}/publish`)

      setSuccess('Final grades calculated and published successfully!')
      await loadStudentGrades()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish final grades')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!isValidCourseId) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          Invalid course offering id.
        </div>
        <button onClick={() => router.push('/courses')} className="px-4 py-2 text-[#8B1A1A] hover:underline">
          ← Back to My Courses
        </button>
      </div>
    )
  }

  if (error && !courseInfo) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
        <button onClick={() => router.back()} className="px-4 py-2 text-[#8B1A1A] hover:underline">
          ← Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center text-[#8B1A1A] hover:underline mb-4">
          <span className="mr-2">←</span>
          Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grade Entry</h1>
        {courseInfo && (
          <p className="text-gray-600">
            {courseInfo.courseCode} - {courseInfo.courseName} (Section {courseInfo.section})
          </p>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg">{success}</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
      )}

      {/* Grade Components */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Grade Components</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#8B1A1A] text-white rounded-lg font-semibold hover:bg-[#6B1414] transition-colors"
          >
            + Add Component
          </button>
        </div>
        {gradeComponents.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
            No grade components defined yet. Click &quot;Add Component&quot; to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gradeComponents.map((comp) => (
              <div key={comp.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{comp.name}</p>
                    <p className="text-xs text-gray-600">{comp.typeText}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">📎</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>Max: {comp.maxScore}</span>
                  <span>Weight: {comp.weight}%</span>
                </div>
                {comp.dueDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Due: {new Date(comp.dueDate).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={() => window.open(`/grades/submissions/${comp.id}`, '_blank')}
                  className="mt-3 w-full px-3 py-1.5 bg-[#8B1A1A] text-white text-xs rounded hover:bg-[#6B1414] transition-colors"
                >
                  View Submissions
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Filter */}
      {gradeComponents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by student name, number, or email..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
      )}

      {/* Grade Entry Table */}
      {gradeComponents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Student Grades ({totalCount})</h2>
              {hasUnsavedChanges && (
                <p className="text-sm text-amber-600 mt-1">⚠ You have unsaved changes on this page</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="px-6 py-2 bg-[#8B1A1A] text-white rounded-lg font-semibold hover:bg-[#6B1414] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Page Grades'}
              </button>
              <button
                onClick={handlePublishFinalGrades}
                disabled={isPublishing}
                className="px-6 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Publish Final Grades'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : studentGrades.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No students found with current filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase sticky left-0 bg-gray-50">
                        Student
                      </th>
                      {gradeComponents.map((comp) => (
                        <th
                          key={comp.id}
                          className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase"
                        >
                          <div>{comp.name}</div>
                          <div className="text-gray-500 font-normal">({comp.maxScore} pts)</div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentGrades.map((student) => (
                      <tr key={student.enrollmentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                          <div>{student.studentName}</div>
                          <div className="text-xs text-gray-500">{student.studentNumber}</div>
                        </td>
                        {student.gradeComponents.map((comp) => {
                          const component = gradeComponents.find((c) => c.id === comp.componentId)
                          return (
                            <td key={comp.componentId} className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={component?.maxScore}
                                step="0.1"
                                value={comp.score ?? ''}
                                onChange={(e) =>
                                  handleScoreChange(student.enrollmentId, comp.componentId, e.target.value)
                                }
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                                placeholder="-"
                              />
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-center">
                          {student.finalLetterGrade ? (
                            <div>
                              <span className="text-sm font-bold text-green-600">{student.finalLetterGrade}</span>
                              {student.finalNumericGrade !== undefined && student.finalNumericGrade !== null && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({student.finalNumericGrade.toFixed(1)})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Grade Entry Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enter scores for each grade component</li>
              <li>• &quot;Save Page Grades&quot; saves the grades for students currently visible on this page</li>
              <li>• Save before moving to the next page — unsaved changes will be lost (you&apos;ll be warned)</li>
              <li>• After all pages are saved, click &quot;Publish Final Grades&quot; to calculate letter grades</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Grade Component Modal (unchanged) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Grade Component</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Component Name *</label>
                  <input
                    type="text"
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                    placeholder="e.g., Midterm Exam, Assignment 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={componentForm.type}
                    onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Project">Project</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final Exam</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Participation">Participation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (%) *</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={componentForm.weight}
                      onChange={(e) => setComponentForm({ ...componentForm, weight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Score *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={componentForm.maxScore}
                      onChange={(e) => setComponentForm({ ...componentForm, maxScore: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={componentForm.dueDate}
                    onChange={(e) => setComponentForm({ ...componentForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Required for assignments that need student submission</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={componentForm.isPublished}
                    onChange={(e) => setComponentForm({ ...componentForm, isPublished: e.target.checked })}
                    className="w-4 h-4 text-[#8B1A1A] border-gray-300 rounded focus:ring-[#8B1A1A]"
                  />
                  <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                    Publish immediately (students can see this component)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setComponentForm({
                      name: '',
                      type: 'Assignment',
                      weight: '',
                      maxScore: '',
                      dueDate: '',
                      isPublished: true,
                    })
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateComponent}
                  disabled={isCreating}
                  className="px-6 py-2 bg-[#8B1A1A] text-white rounded-lg font-semibold hover:bg-[#6B1414] transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Component'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
