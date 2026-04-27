'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  curriculumApi,
  coursesApi,
  CurriculumDto,
  CurriculumCourse,
} from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'

interface CourseListItem {
  id: number
  code: string
  name: string
  credits: number
}

export default function CurriculumPage() {
  const router = useRouter()
  const params = useParams()
  const programId = Number(params.id)

  const [curriculum, setCurriculum] = useState<CurriculumDto | null>(null)
  const [allCourses, setAllCourses] = useState<CourseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)

  // Add-course modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('')
  const [selectedYearLevel, setSelectedYearLevel] = useState<number>(1)
  const [selectedIsRequired, setSelectedIsRequired] = useState<boolean>(true)

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<CurriculumCourse | null>(null)

  const loadCurriculum = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const [curriculumResponse, coursesResponse] = await Promise.all([
        curriculumApi.get(programId),
        coursesApi.getAll(),
      ])
      setCurriculum(curriculumResponse.data as CurriculumDto)
      const courses = (coursesResponse.data || []) as Array<{
        id: number
        code: string
        name: string
        credits: number
      }>
      setAllCourses(
        courses.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          credits: c.credits,
        }))
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load curriculum'
      console.error('Failed to load curriculum:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [programId])

  useEffect(() => {
    if (programId) {
      loadCurriculum()
    }
  }, [programId, loadCurriculum])

  const assignedCourseIds = useMemo<Set<number>>(() => {
    const ids = new Set<number>()
    if (curriculum) {
      curriculum.years.forEach((year) => {
        year.courses.forEach((c) => ids.add(c.courseId))
      })
    }
    return ids
  }, [curriculum])

  const availableCourses = useMemo<CourseListItem[]>(() => {
    return allCourses.filter((c) => !assignedCourseIds.has(c.id))
  }, [allCourses, assignedCourseIds])

  const durationYears = curriculum?.durationYears ?? 4
  const yearLevels = useMemo<number[]>(
    () => Array.from({ length: durationYears }, (_, i) => i + 1),
    [durationYears]
  )

  const openAddModal = (): void => {
    setSelectedCourseId('')
    setSelectedYearLevel(1)
    setSelectedIsRequired(true)
    setActionError(null)
    setAddModalOpen(true)
  }

  const closeAddModal = (): void => {
    if (mutating) return
    setAddModalOpen(false)
  }

  const handleAddCourse = async (): Promise<void> => {
    if (!selectedCourseId || !curriculum) return
    try {
      setMutating(true)
      setActionError(null)
      // Compute next sortOrder in the target year
      const year = curriculum.years.find((y) => y.yearLevel === selectedYearLevel)
      const nextSortOrder = year && year.courses.length > 0
        ? Math.max(...year.courses.map((c) => c.sortOrder)) + 1
        : 0
      await curriculumApi.add(programId, {
        courseId: Number(selectedCourseId),
        yearLevel: selectedYearLevel,
        isRequired: selectedIsRequired,
        sortOrder: nextSortOrder,
      })
      setAddModalOpen(false)
      await loadCurriculum()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add course'
      console.error('Failed to add course:', err)
      setActionError(message)
    } finally {
      setMutating(false)
    }
  }

  const handleUpdate = async (
    course: CurriculumCourse,
    changes: Partial<{ yearLevel: number; isRequired: boolean; sortOrder: number }>
  ): Promise<void> => {
    try {
      setMutating(true)
      setActionError(null)
      await curriculumApi.update(programId, course.id, {
        yearLevel: changes.yearLevel ?? course.yearLevel,
        isRequired: changes.isRequired ?? course.isRequired,
        sortOrder: changes.sortOrder ?? course.sortOrder,
      })
      await loadCurriculum()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update course'
      console.error('Failed to update course:', err)
      setActionError(message)
    } finally {
      setMutating(false)
    }
  }

  const handleMove = async (
    course: CurriculumCourse,
    direction: 'up' | 'down'
  ): Promise<void> => {
    if (!curriculum) return
    const year = curriculum.years.find((y) => y.yearLevel === course.yearLevel)
    if (!year) return
    const sorted = [...year.courses].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((c) => c.id === course.id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return
    const swapTarget = sorted[targetIdx]

    try {
      setMutating(true)
      setActionError(null)
      // Swap sortOrders
      await curriculumApi.update(programId, course.id, {
        yearLevel: course.yearLevel,
        isRequired: course.isRequired,
        sortOrder: swapTarget.sortOrder,
      })
      await curriculumApi.update(programId, swapTarget.id, {
        yearLevel: swapTarget.yearLevel,
        isRequired: swapTarget.isRequired,
        sortOrder: course.sortOrder,
      })
      await loadCurriculum()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to reorder course'
      console.error('Failed to move course:', err)
      setActionError(message)
    } finally {
      setMutating(false)
    }
  }

  const handleYearChange = async (
    course: CurriculumCourse,
    newYear: number
  ): Promise<void> => {
    if (newYear === course.yearLevel) return
    await handleUpdate(course, { yearLevel: newYear, sortOrder: 0 })
  }

  const handleToggleRequired = async (course: CurriculumCourse): Promise<void> => {
    await handleUpdate(course, { isRequired: !course.isRequired })
  }

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    try {
      setMutating(true)
      setActionError(null)
      await curriculumApi.remove(programId, deleteTarget.id)
      setDeleteTarget(null)
      await loadCurriculum()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to remove course'
      console.error('Failed to remove course:', err)
      setActionError(message)
    } finally {
      setMutating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
      </div>
    )
  }

  if (error || !curriculum) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p>{error || 'Curriculum not found'}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => router.push('/programs')}>
          ← Back to Programs
        </Button>
      </div>
    )
  }

  const progressPct = curriculum.totalCreditsRequired > 0
    ? Math.min(
        100,
        Math.round(
          (curriculum.assignedCredits / curriculum.totalCreditsRequired) * 100
        )
      )
    : 0

  // Ensure we render a column for each year in durationYears,
  // falling back to empty course lists when backend omits a year.
  const yearsMap = new Map<number, CurriculumDto['years'][number]>()
  curriculum.years.forEach((y) => yearsMap.set(y.yearLevel, y))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/programs"
              className="text-sm text-[#8B1A1A] hover:underline"
            >
              ← Back to Programs
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {curriculum.programName}
          </h1>
          <p className="text-gray-600 mt-1">Curriculum Management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openAddModal}>
            <span className="mr-2">➕</span>
            Add Course
          </Button>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p>{actionError}</p>
          </div>
        </div>
      )}

      {/* Credits Progress */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Credits Assigned
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {curriculum.assignedCredits}{' '}
              <span className="text-base font-normal text-gray-500">
                / {curriculum.totalCreditsRequired} required
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-lg font-semibold text-gray-900">
              {curriculum.durationYears} years
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#8B1A1A] h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{progressPct}% complete</p>
      </div>

      {/* Years grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {yearLevels.map((yearLevel) => {
          const year = yearsMap.get(yearLevel)
          const courses = year
            ? [...year.courses].sort((a, b) => a.sortOrder - b.sortOrder)
            : []
          const totalCredits = year?.totalCredits ?? 0
          return (
            <div
              key={yearLevel}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
                <h2 className="text-lg font-semibold text-gray-900">
                  Year {yearLevel}
                </h2>
                <span className="text-sm text-gray-600">
                  {totalCredits} credits
                </span>
              </div>
              <div className="p-3 space-y-3 min-h-[100px]">
                {courses.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4">
                    No courses
                  </p>
                ) : (
                  courses.map((course, idx) => (
                    <div
                      key={course.id}
                      className="rounded-md border border-gray-200 p-3 hover:border-[#8B1A1A] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-[#8B1A1A]">
                              {course.courseCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] leading-4 font-semibold rounded-full ${
                                course.isRequired
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {course.isRequired ? 'Required' : 'Elective'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                            {course.courseName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {course.courseCredits} credits
                          </p>
                        </div>
                      </div>

                      {/* Action row */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={mutating || idx === 0}
                            onClick={() => handleMove(course, 'up')}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={mutating || idx === courses.length - 1}
                            onClick={() => handleMove(course, 'down')}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={mutating}
                            onClick={() => handleToggleRequired(course)}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              course.isRequired
                                ? 'Mark as elective'
                                : 'Mark as required'
                            }
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            disabled={mutating}
                            value={course.yearLevel}
                            onChange={(e) =>
                              handleYearChange(course, Number(e.target.value))
                            }
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-[#8B1A1A] focus:border-transparent disabled:opacity-50"
                            title="Change year"
                          >
                            {yearLevels.map((y) => (
                              <option key={y} value={y}>
                                Year {y}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={mutating}
                            onClick={() => setDeleteTarget(course)}
                            className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Remove from curriculum"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state (no years have courses at all) */}
      {curriculum.assignedCredits === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-500 mb-4">
            No courses assigned yet — click Add Course to build this program&apos;s
            curriculum.
          </p>
          <Button onClick={openAddModal}>
            <span className="mr-2">➕</span>
            Add Course
          </Button>
        </div>
      )}

      {/* Add Course Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        title="Add Course to Curriculum"
      >
        <div className="space-y-4">
          {availableCourses.length === 0 ? (
            <p className="text-gray-600">
              All existing courses are already assigned to this program.
            </p>
          ) : (
            <>
              <Select
                label="Course"
                required
                value={selectedCourseId === '' ? '' : String(selectedCourseId)}
                onChange={(e) =>
                  setSelectedCourseId(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                options={availableCourses.map((c) => ({
                  value: c.id,
                  label: `${c.code} — ${c.name} (${c.credits} cr)`,
                }))}
              />

              <Select
                label="Year Level"
                required
                value={String(selectedYearLevel)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setSelectedYearLevel(Number.isFinite(v) && v >= 1 ? v : 1)
                }}
                options={yearLevels.map((y) => ({
                  value: y,
                  label: `Year ${y}`,
                }))}
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={selectedIsRequired}
                  onChange={(e) => setSelectedIsRequired(e.target.checked)}
                  className="w-4 h-4 text-[#8B1A1A] bg-gray-100 border-gray-300 rounded focus:ring-[#8B1A1A]"
                />
                <label
                  htmlFor="isRequired"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Required Course (uncheck for Elective)
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={closeAddModal}
              disabled={mutating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCourse}
              isLoading={mutating}
              disabled={!selectedCourseId || availableCourses.length === 0}
            >
              Add Course
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!mutating) setDeleteTarget(null)
        }}
        title="Remove Course"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to remove{' '}
            <strong>
              {deleteTarget?.courseCode} — {deleteTarget?.courseName}
            </strong>{' '}
            from this curriculum?
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={mutating}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={mutating}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
