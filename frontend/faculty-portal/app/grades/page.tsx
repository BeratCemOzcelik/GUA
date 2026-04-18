'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api, academicTermsApi } from '@/lib/api'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'

interface CourseOffering {
  id: number
  courseCode: string
  courseName: string
  section: string
  termId: number
  termName: string
  enrolledCount: number
}

interface AcademicTerm {
  id: number
  name: string
  code: string
}

export default function GradesPage() {
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [terms, setTerms] = useState<AcademicTerm[]>([])

  const [selectedTermId, setSelectedTermId] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTerms()
  }, [])

  useEffect(() => {
    loadMyCourses()
  }, [selectedTermId, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [selectedTermId, search, pageSize])

  const loadTerms = async () => {
    try {
      const res = await academicTermsApi.getAll()
      setTerms(res.data || [])
    } catch {}
  }

  const loadMyCourses = async () => {
    try {
      setIsLoading(true)
      setError('')

      const qs = new URLSearchParams()
      if (selectedTermId) qs.append('termId', selectedTermId.toString())
      if (search) qs.append('search', search)
      qs.append('page', page.toString())
      qs.append('pageSize', pageSize.toString())

      const response = await api.get(`/courseofferings/my-courses?${qs.toString()}`)
      const data = response.data.data
      setCourses(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grade Management</h1>
        <p className="text-gray-600">Select a course to enter grades</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by course code, name, or section..."
        />
        <select
          value={selectedTermId || ''}
          onChange={(e) => setSelectedTermId(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
        >
          <option value="">All Terms</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No courses found.</p>
          </div>
        ) : (
          <>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/grades/${course.id}`}
                  className="block border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{course.courseCode}</h3>
                    <p className="text-sm text-gray-900 font-medium mb-1">{course.courseName}</p>
                    <p className="text-xs text-gray-600">
                      Section {course.section} • {course.termName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600">Students</p>
                      <p className="text-2xl font-bold text-[#8B1A1A]">{course.enrolledCount}</p>
                    </div>
                    <div className="text-[#8B1A1A] font-semibold">Enter Grades →</div>
                  </div>
                </Link>
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
