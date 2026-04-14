'use client'

import { useState, useEffect } from 'react'
import {
  studentProfileApi,
  curriculumApi,
  enrollmentsApi,
} from '@/lib/api'
import {
  StudentProfile,
  Curriculum,
  CurriculumCourse,
  Enrollment,
} from '@/lib/types'
import ConfirmModal from '@/components/ConfirmModal'

type StatusKey = 'Completed' | 'InProgress' | 'Dropped' | 'NotStarted'

interface CourseProgress {
  status: StatusKey
  enrollmentId?: number
  finalGrade?: string | null
  gradePoint?: number | null
  credits?: number
}

interface AvailableOffering {
  id: number
  courseCode: string
  courseName: string
  credits: number
}

export default function ProgramPlanPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [progressMap, setProgressMap] = useState<Record<number, CourseProgress>>({})
  const [offeringByCourseCode, setOfferingByCourseCode] = useState<Record<string, AvailableOffering>>({})

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    courseOfferingId: number | null
    courseName: string
  }>({ isOpen: false, courseOfferingId: null, courseName: '' })

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error'
  }>({ isOpen: false, title: '', message: '', type: 'success' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')

      const profileRes = await studentProfileApi.getMyProfile()
      const loadedProfile: StudentProfile = profileRes.data
      setProfile(loadedProfile)

      if (!loadedProfile?.programId) {
        setIsLoading(false)
        return
      }

      // Load curriculum, enrollments and available offerings in parallel
      const [curriculumRes, enrollmentsRes, availableRes] = await Promise.all([
        curriculumApi.get(loadedProfile.programId),
        enrollmentsApi.getMyEnrollments(),
        enrollmentsApi.getAvailable(undefined, true).catch(() => ({ data: [] })),
      ])

      const loadedCurriculum: Curriculum = curriculumRes.data
      setCurriculum(loadedCurriculum)

      // Build offering-by-courseCode map (one active offering per course code)
      const offeringsMap: Record<string, AvailableOffering> = {}
      const availList: AvailableOffering[] = (availableRes?.data || []).map((o: any) => ({
        id: o.id,
        courseCode: o.courseCode,
        courseName: o.courseName,
        credits: o.credits,
      }))
      for (const o of availList) {
        if (o.courseCode && !offeringsMap[o.courseCode]) {
          offeringsMap[o.courseCode] = o
        }
      }
      setOfferingByCourseCode(offeringsMap)

      // Build a courseId → progress map from enrollments.
      // Enrollments response (my-enrollments) comes back flattened with courseCode/courseName/etc.
      const enrollmentsList: any[] = enrollmentsRes?.data || []

      // Map curriculum course code → courseId so we can join enrollment (which gives code)
      const codeToCourseId: Record<string, number> = {}
      for (const y of loadedCurriculum.years) {
        for (const c of y.courses) {
          codeToCourseId[c.courseCode] = c.courseId
        }
      }

      const map: Record<number, CourseProgress> = {}
      for (const e of enrollmentsList) {
        const courseId = codeToCourseId[e.courseCode]
        if (!courseId) continue

        let status: StatusKey = 'NotStarted'
        if (e.status === 'Completed') status = 'Completed'
        else if (e.status === 'Enrolled') status = 'InProgress'
        else if (e.status === 'Dropped') status = 'Dropped'

        // Prefer Completed over other statuses if multiple enrollments exist
        const existing = map[courseId]
        if (existing && existing.status === 'Completed') continue

        map[courseId] = {
          status,
          enrollmentId: e.id,
          finalGrade: e.finalGrade ?? null,
          gradePoint: e.gradePoint ?? null,
          credits: e.credits,
        }
      }
      setProgressMap(map)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Failed to load program plan data'
      setError(msg)
      console.error('Program plan error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartCourse = (course: CurriculumCourse) => {
    const offering = offeringByCourseCode[course.courseCode]
    if (!offering) {
      setAlertModal({
        isOpen: true,
        title: 'Unable to Start Course',
        message: `No active offering is available for ${course.courseCode} - ${course.courseName}. Please contact the registrar.`,
        type: 'error',
      })
      return
    }
    setConfirmModal({
      isOpen: true,
      courseOfferingId: offering.id,
      courseName: `${course.courseCode} - ${course.courseName}`,
    })
  }

  const confirmStartCourse = async () => {
    const { courseOfferingId, courseName } = confirmModal
    setConfirmModal({ isOpen: false, courseOfferingId: null, courseName: '' })
    if (!courseOfferingId) return

    try {
      setEnrollingCourseId(courseOfferingId)
      await enrollmentsApi.enroll(courseOfferingId)
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: `You have started ${courseName}.`,
        type: 'success',
      })
      await loadData()
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || 'Failed to start course.'
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error',
      })
      console.error('Enroll error:', err)
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const cancelStartCourse = () => {
    setConfirmModal({ isOpen: false, courseOfferingId: null, courseName: '' })
  }

  const closeAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'success' })
  }

  // ---- Derived stats ----
  const allCourses: CurriculumCourse[] =
    curriculum?.years.flatMap((y) => y.courses) || []

  const totalCourses = allCourses.length
  const requiredCourses = allCourses.filter((c) => c.isRequired)

  const completedCourses = allCourses.filter(
    (c) => progressMap[c.courseId]?.status === 'Completed'
  )
  const inProgressCourses = allCourses.filter(
    (c) => progressMap[c.courseId]?.status === 'InProgress'
  )
  const requiredCompletedCourses = requiredCourses.filter(
    (c) => progressMap[c.courseId]?.status === 'Completed'
  )

  const creditsEarned = profile?.totalCreditsEarned ?? 0
  const totalCreditsRequired =
    curriculum?.totalCreditsRequired && curriculum.totalCreditsRequired > 0
      ? curriculum.totalCreditsRequired
      : curriculum?.assignedCredits || 0

  const progressPercent =
    totalCreditsRequired > 0
      ? Math.min(100, Math.round((creditsEarned / totalCreditsRequired) * 100))
      : 0

  const diplomaEligible =
    totalCreditsRequired > 0 &&
    creditsEarned >= totalCreditsRequired &&
    requiredCompletedCourses.length === requiredCourses.length &&
    requiredCourses.length > 0

  // ---- Render helpers ----
  const renderStatusBadge = (status: StatusKey) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
            ✓ Completed
          </span>
        )
      case 'InProgress':
        return (
          <span className="inline-flex items-center text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
            ⟳ In Progress
          </span>
        )
      case 'Dropped':
        return (
          <span className="inline-flex items-center text-xs px-3 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
            — Dropped
          </span>
        )
      case 'NotStarted':
      default:
        return (
          <span className="inline-flex items-center text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
            ○ Not Started
          </span>
        )
    }
  }

  const renderGradeBadge = (grade: string) => {
    const firstChar = grade.charAt(0)
    let color = 'bg-gray-100 text-gray-700'
    if (firstChar === 'A') color = 'bg-green-100 text-green-700'
    else if (firstChar === 'B') color = 'bg-blue-100 text-blue-700'
    else if (firstChar === 'C') color = 'bg-amber-100 text-amber-700'
    else if (firstChar === 'D') color = 'bg-orange-100 text-orange-700'
    else if (firstChar === 'F') color = 'bg-red-100 text-red-700'
    return (
      <span
        className={`text-sm px-3 py-1 rounded-full font-bold ${color}`}
      >
        {grade}
      </span>
    )
  }

  // ---- Render ----
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

  if (!profile) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
        Profile not found. Please contact the registrar.
      </div>
    )
  }

  if (!profile.programId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Program Plan</h1>
          <p className="text-gray-600">Degree audit and progress tracking</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
          Your program hasn&apos;t been assigned yet — please contact the admin.
        </div>
      </div>
    )
  }

  if (!curriculum || allCourses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Program Plan</h1>
          <p className="text-gray-600">
            {profile.programName}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            The curriculum for your program has not been defined yet.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please check back later or contact the registrar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Program Plan</h1>
        <p className="text-gray-600 mb-4">
          Program: <span className="font-semibold">{curriculum.programName}</span>
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-700 mb-1">
            <span className="font-medium">
              {creditsEarned} / {totalCreditsRequired} credits earned
            </span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#8B1A1A] h-3 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-semibold">{completedCourses.length}</span> of{' '}
          <span className="font-semibold">{totalCourses}</span> courses completed
          {inProgressCourses.length > 0 && (
            <span className="ml-2 text-blue-700">
              ({inProgressCourses.length} in progress)
            </span>
          )}
        </div>
      </div>

      {/* Main layout: courses + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Year-grouped course list */}
        <div className="lg:col-span-2 space-y-6">
          {curriculum.years.map((year) => (
            <div
              key={year.yearLevel}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Year {year.yearLevel}
                </h2>
                <p className="text-sm text-gray-600">
                  {year.courses.length} course{year.courses.length !== 1 ? 's' : ''} · {year.totalCredits} credits
                </p>
              </div>

              {year.courses.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No courses assigned for this year yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {year.courses.map((course) => {
                    const progress = progressMap[course.courseId]
                    const status: StatusKey = progress?.status || 'NotStarted'
                    const isEnrolling =
                      enrollingCourseId ===
                      offeringByCourseCode[course.courseCode]?.id

                    return (
                      <li
                        key={course.id}
                        className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">
                              {course.courseCode}
                            </span>
                            <span className="text-sm text-gray-700">
                              {course.courseName}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                course.isRequired
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {course.isRequired ? 'Required' : 'Elective'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {course.courseCredits} credits
                            </span>
                          </div>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            {renderStatusBadge(status)}
                            {progress?.finalGrade && (
                              <>
                                {renderGradeBadge(progress.finalGrade)}
                                {progress.gradePoint != null && (
                                  <span className="text-xs text-gray-600">
                                    ({progress.gradePoint.toFixed(2)} pts)
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end">
                          {status === 'NotStarted' || status === 'Dropped' ? (
                            <button
                              onClick={() => handleStartCourse(course)}
                              disabled={isEnrolling}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                              {isEnrolling ? 'Starting...' : 'Start Course'}
                            </button>
                          ) : status === 'InProgress' && progress?.enrollmentId ? (
                            <a
                              href={`/grades/${progress.enrollmentId}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                            >
                              View Progress
                            </a>
                          ) : status === 'Completed' && progress?.enrollmentId ? (
                            <a
                              href={`/grades/${progress.enrollmentId}`}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                              View Details
                            </a>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-600">Credits earned / required</dt>
                <dd className="text-2xl font-bold text-[#8B1A1A] mt-1">
                  {creditsEarned}{' '}
                  <span className="text-base text-gray-500 font-normal">
                    / {totalCreditsRequired}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Required courses</dt>
                <dd className="text-2xl font-bold text-gray-900 mt-1">
                  {requiredCompletedCourses.length}{' '}
                  <span className="text-base text-gray-500 font-normal">
                    / {requiredCourses.length}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Current GPA</dt>
                <dd className="text-2xl font-bold text-gray-900 mt-1">
                  {profile.currentGPA != null
                    ? profile.currentGPA.toFixed(2)
                    : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Courses completed</dt>
                <dd className="text-2xl font-bold text-gray-900 mt-1">
                  {completedCourses.length}{' '}
                  <span className="text-base text-gray-500 font-normal">
                    / {totalCourses}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div
            className={`rounded-lg p-6 border ${
              diplomaEligible
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Diploma Eligibility
            </h3>
            {diplomaEligible ? (
              <p className="text-sm text-green-700 font-medium">
                ✓ You have met all requirements for your diploma. Contact the
                registrar to begin the graduation process.
              </p>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p>You are not yet eligible for a diploma.</p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>
                    Credits:{' '}
                    <span className="font-semibold">
                      {creditsEarned}/{totalCreditsRequired}
                    </span>
                  </li>
                  <li>
                    Required courses:{' '}
                    <span className="font-semibold">
                      {requiredCompletedCourses.length}/{requiredCourses.length}
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Confirm Start Course Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Start Course"
        message={`Are you sure you want to enroll in ${confirmModal.courseName}?`}
        confirmText="Start Course"
        cancelText="Cancel"
        onConfirm={confirmStartCourse}
        onCancel={cancelStartCourse}
        type="confirm"
      />

      {/* Alert Modal */}
      <ConfirmModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        onConfirm={closeAlert}
        onCancel={closeAlert}
        type="alert"
      />
    </div>
  )
}
