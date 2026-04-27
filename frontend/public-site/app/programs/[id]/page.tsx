'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { programsApi, departmentsApi, curriculumApi } from '@/lib/api'

interface CurriculumCourse {
  id: number
  programId: number
  courseId: number
  courseCode: string
  courseName: string
  courseCredits: number
  courseDescription: string | null
  yearLevel: number
  isRequired: boolean
  sortOrder: number
}

interface CurriculumYear {
  yearLevel: number
  totalCredits: number
  courses: CurriculumCourse[]
}

interface Curriculum {
  programId: number
  programName: string
  durationYears: number
  totalCreditsRequired: number
  assignedCredits: number
  years: CurriculumYear[]
}

export default function ProgramDetailPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  const [program, setProgram] = useState<any>(null)
  const [department, setDepartment] = useState<any>(null)
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const progRes = await programsApi.getById(id)
      const prog = progRes.data
      setProgram(prog)
      if (prog?.departmentId) {
        const deptRes = await departmentsApi.getById(prog.departmentId)
        setDepartment(deptRes.data)
      }

      // Try curriculum endpoint first
      try {
        const currRes = await curriculumApi.get(id)
        if (currRes?.success && currRes?.data) {
          setCurriculum(currRes.data as Curriculum)
        }
      } catch (currErr) {
        console.warn('Curriculum fetch failed, falling back to department courses', currErr)
      }

      // Course no longer has a direct department link; if the program has no curriculum
      // configured, the courses section will simply be empty.
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Program not found</h1>
          <Link href="/programs" className="text-primary mt-4 inline-block hover:underline">Back to Programs</Link>
        </div>
        <Footer />
      </div>
    )
  }

  // Determine if curriculum has any actual courses
  const curriculumHasCourses =
    !!curriculum && curriculum.years.some((y) => y.courses.length > 0)

  const totalCurriculumCourses = curriculum
    ? curriculum.years.reduce((sum, y) => sum + y.courses.length, 0)
    : 0

  const yearsCount = curriculum?.years.length ?? 0
  const creditsAssigned = curriculum?.assignedCredits ?? 0

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <Link href="/programs" className="text-gold/80 text-sm mb-4 inline-flex items-center gap-1 hover:text-gold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Programs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{program.name}</h1>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">{program.code}</span>
            {program.degreeType && <span className="px-3 py-1 bg-gold text-navy text-sm rounded-full font-medium">{program.degreeType}</span>}
            {department && <span className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">{department.name}</span>}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Program Overview</h2>
            <p className="text-gray-700 leading-relaxed mb-10">{program.description}</p>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Curriculum</h2>
            {curriculum && curriculumHasCourses && (
              <p className="text-sm text-gray-500 mb-6">
                {totalCurriculumCourses} {totalCurriculumCourses === 1 ? 'course' : 'courses'} across {yearsCount} {yearsCount === 1 ? 'year' : 'years'} · {creditsAssigned} credits
              </p>
            )}

            {curriculum && curriculumHasCourses ? (
              <div className="space-y-10">
                {curriculum.years
                  .slice()
                  .sort((a, b) => a.yearLevel - b.yearLevel)
                  .map((year) => (
                    <div key={year.yearLevel}>
                      <div className="flex items-baseline justify-between mb-5 pb-3 border-b-2 border-primary/10">
                        <div>
                          <h3 className="text-xl font-bold text-primary">{ordinal(year.yearLevel)} Year</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {year.totalCredits} Credits · {year.courses.length} {year.courses.length === 1 ? 'Course' : 'Courses'}
                          </p>
                        </div>
                      </div>

                      {year.courses.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No courses assigned for this year yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {year.courses
                            .slice()
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((course) => (
                              <div
                                key={course.id}
                                className="bg-gray-50 rounded-xl p-5 border border-gray-100 card-hover flex flex-col"
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-primary/80 tracking-wide mb-1">{course.courseCode}</p>
                                    <h4 className="font-bold text-gray-900 leading-snug">{course.courseName}</h4>
                                  </div>
                                  <span
                                    className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                                      course.isRequired
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-gold/20 text-[#8a7420]'
                                    }`}
                                  >
                                    {course.isRequired ? 'Core' : 'Elective'}
                                  </span>
                                </div>

                                {course.courseDescription && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{course.courseDescription}</p>
                                )}

                                <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-200/70">
                                  <span className="text-xs text-gray-500">Credits</span>
                                  <span className="text-sm text-primary font-semibold">{course.courseCredits}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600">No courses assigned yet.</p>
            )}
          </div>

          <div>
            <div className="bg-gray-50 rounded-2xl p-7 border border-gray-100 sticky top-28">
              <h3 className="font-bold text-gray-900 mb-5">Program Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Program Code</span>
                  <span className="font-medium text-gray-900">{program.code}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Degree Type</span>
                  <span className="font-medium text-gray-900">{program.degreeType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Department</span>
                  <span className="font-medium text-gray-900">{department?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Courses</span>
                  <span className="font-medium text-gray-900">
                    {curriculum && curriculumHasCourses ? totalCurriculumCourses : 0}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Years</span>
                  <span className="font-medium text-gray-900">
                    {curriculum ? (curriculum.durationYears || yearsCount) : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Credits</span>
                  <span className="font-medium text-gray-900">
                    {curriculum
                      ? `${creditsAssigned}${curriculum.totalCreditsRequired ? ` / ${curriculum.totalCreditsRequired}` : ''}`
                      : '—'}
                  </span>
                </div>
              </div>
              <Link href="/apply" className="block mt-6 px-6 py-3.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold text-center transition-colors shadow-sm">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
