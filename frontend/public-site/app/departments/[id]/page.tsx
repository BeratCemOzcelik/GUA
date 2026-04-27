'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { departmentsApi, programsApi, coursesApi, curriculumApi } from '@/lib/api'

export default function DepartmentDetailPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  const [department, setDepartment] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const deptRes = await departmentsApi.getById(id)
      setDepartment(deptRes.data)
      const [progRes, courseRes] = await Promise.all([
        programsApi.getAll(),
        coursesApi.getAll(),
      ])
      const deptPrograms = (progRes.data || []).filter((p: any) => p.departmentId === id)
      setPrograms(deptPrograms)

      // Aggregate courses appearing in any of this department's program curricula.
      // (Course no longer carries a department; it lives inside one or more programs via ProgramCourse.)
      const curricula = await Promise.all(
        deptPrograms.map((p: any) => curriculumApi.get(p.id).catch(() => null))
      )
      const courseIds = new Set<number>()
      for (const c of curricula) {
        const years = c?.data?.years || []
        for (const y of years) {
          for (const cc of (y.courses || [])) courseIds.add(cc.courseId)
        }
      }
      const allCourses = courseRes.data || []
      setCourses(allCourses.filter((c: any) => courseIds.has(c.id)))
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

  if (!department) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Department not found</h1>
          <Link href="/departments" className="text-primary mt-4 inline-block hover:underline">Back to Departments</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <Link href="/departments" className="text-gold/80 text-sm mb-4 inline-flex items-center gap-1 hover:text-gold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Departments
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{department.name}</h1>
          {department.code && <p className="text-lg text-gray-200">{department.code}</p>}
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Department</h2>
          <p className="text-gray-700 leading-relaxed">{department.description}</p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Programs ({programs.length})</h2>
          {programs.length === 0 ? (
            <p className="text-gray-600">No programs available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((prog) => (
                <Link key={prog.id} href={`/programs/${prog.id}`}
                  className="bg-white rounded-xl p-6 card-hover border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{prog.name}</h3>
                    {prog.degreeType && <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full flex-shrink-0 ml-2">{prog.degreeType}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{prog.code}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{prog.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Courses ({courses.length})</h2>
          {courses.length === 0 ? (
            <p className="text-gray-600">No courses available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-1">{course.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{course.code} · {course.credits} Credits</p>
                  {course.description && <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
