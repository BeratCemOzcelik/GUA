'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { programsApi, departmentsApi, coursesApi } from '@/lib/api'

export default function ProgramDetailPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  const [program, setProgram] = useState<any>(null)
  const [department, setDepartment] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
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
      const courseRes = await coursesApi.getAll()
      setCourses((courseRes.data || []).filter((c: any) => c.departmentId === prog?.departmentId))
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

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Courses</h2>
            {courses.length === 0 ? (
              <p className="text-gray-600">No courses available yet.</p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100 card-hover">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">{course.code}</p>
                      </div>
                      <span className="text-sm text-primary font-semibold">{course.credits} Credits</span>
                    </div>
                    {course.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{course.description}</p>}
                  </div>
                ))}
              </div>
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
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Courses</span>
                  <span className="font-medium text-gray-900">{courses.length}</span>
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
