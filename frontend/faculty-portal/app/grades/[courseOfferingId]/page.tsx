'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

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
  weightedAverage?: number
}

export default function GradeEntryPage() {
  const params = useParams()
  const router = useRouter()
  const courseOfferingId = parseInt(params.courseOfferingId as string)

  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([])
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Grade Component creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [componentForm, setComponentForm] = useState({
    name: '',
    type: 'Assignment',
    weight: '',
    maxScore: '',
    dueDate: '',
    isPublished: true  // Default to published so students can see it
  })

  useEffect(() => {
    loadGradeData()
  }, [courseOfferingId])

  const loadGradeData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Load course info
      const courseRes = await api.get(`/CourseOfferings/${courseOfferingId}`)
      setCourseInfo(courseRes.data.data)

      // Load students
      const studentsRes = await api.get(`/Enrollments/by-course-offering/${courseOfferingId}/students`)
      const students = studentsRes.data.data || []

      // Load grade components for this course offering
      const componentsRes = await api.get(`/GradeComponents/by-course-offering/${courseOfferingId}`)
      const components = componentsRes.data.data || []
      console.log('Grade components loaded:', components)
      setGradeComponents(components)

      // Initialize student grades structure
      const studentGradesData: StudentGrade[] = students.map((student: any) => ({
        enrollmentId: student.enrollmentId,
        studentNumber: student.studentNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        gradeComponents: components.map((comp: any) => ({
          componentId: comp.id,  // Keep as componentId for the grade structure
          score: undefined,
          gradeId: undefined,
        })),
        finalLetterGrade: student.finalLetterGrade,
        finalNumericGrade: student.finalNumericGrade,
      }))

      // Load existing grades for each student
      for (const studentGrade of studentGradesData) {
        try {
          const gradesRes = await api.get(`/Grades/enrollment/${studentGrade.enrollmentId}`)
          const enrollmentData = gradesRes.data.data // StudentGradesSummaryDto object
          const componentGrades = enrollmentData?.componentGrades || []

          // Map existing grades to components
          componentGrades.forEach((compGrade: any) => {
            if (compGrade.grade) {  // Grade is nested inside componentGrade
              const studentCompGrade = studentGrade.gradeComponents.find(
                (g) => g.componentId === compGrade.componentId
              )
              if (studentCompGrade) {
                studentCompGrade.score = compGrade.grade.score
                studentCompGrade.gradeId = compGrade.grade.id
              }
            }
          })
        } catch (err) {
          console.error(`Failed to load grades for enrollment ${studentGrade.enrollmentId}`, err)
        }
      }

      setStudentGrades(studentGradesData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load grade data')
      console.error('Load grade data error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScoreChange = (enrollmentId: number, componentId: number, value: string) => {
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

  const handleCreateComponent = async () => {
    try {
      setIsCreating(true)
      setError('')
      setSuccess('')

      // Validate form
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
        courseOfferingId: courseOfferingId,
        name: componentForm.name,
        type: componentForm.type,
        weight: weight,
        maxScore: maxScore,
        dueDate: componentForm.dueDate ? new Date(componentForm.dueDate).toISOString() : null,
        isPublished: componentForm.isPublished
      }

      console.log('Creating grade component with payload:', payload)
      const response = await api.post('/GradeComponents', payload)
      console.log('Grade component created:', response.data)

      setSuccess('Grade component created successfully!')
      setShowCreateModal(false)
      setComponentForm({
        name: '',
        type: 'Assignment',
        weight: '',
        maxScore: '',
        dueDate: '',
        isPublished: true
      })
      loadGradeData() // Reload to get updated data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create grade component')
      console.error('Create component error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveGrades = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Save all grades
      for (const student of studentGrades) {
        for (const comp of student.gradeComponents) {
          if (comp.score !== undefined && comp.score !== null) {
            const payload = {
              enrollmentId: student.enrollmentId,
              gradeComponentId: comp.componentId,
              score: comp.score,
            }

            if (comp.gradeId) {
              // Update existing grade
              await api.put(`/Grades/${comp.gradeId}`, payload)
            } else {
              // Create new grade
              await api.post('/Grades', payload)
            }
          }
        }
      }

      setSuccess('Grades saved successfully!')
      loadGradeData() // Reload to get updated data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save grades')
      console.error('Save grades error:', err)
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
      loadGradeData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish final grades')
      console.error('Publish final grades error:', err)
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !courseInfo) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
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
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Grade Components Info */}
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
            No grade components defined yet. Click "Add Component" to create one.
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

      {/* Grade Entry Table */}
      {gradeComponents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Student Grades</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="px-6 py-2 bg-[#8B1A1A] text-white rounded-lg font-semibold hover:bg-[#6B1414] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save All Grades'}
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
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Final
                  </th>
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
                          <span className="text-sm font-bold text-green-600">
                            {student.finalLetterGrade}
                          </span>
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
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Grade Entry Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enter scores for each grade component (assignments, exams, etc.)</li>
              <li>• Scores must be between 0 and the max score for each component</li>
              <li>• Click "Save All Grades" to save your entries</li>
              <li>• After saving all scores, click "Publish Final Grades" to calculate and publish letter grades</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Grade Component Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Grade Component</h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component Name *
                  </label>
                  <input
                    type="text"
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                    placeholder="e.g., Midterm Exam, Assignment 1"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
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

                {/* Weight and Max Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (%) *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Score *
                    </label>
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

                {/* Due Date (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={componentForm.dueDate}
                    onChange={(e) => setComponentForm({ ...componentForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for assignments that need student submission
                  </p>
                </div>

                {/* Published */}
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
                      isPublished: true
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
