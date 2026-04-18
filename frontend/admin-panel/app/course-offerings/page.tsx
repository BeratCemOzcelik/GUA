'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { courseOfferingsApi, academicTermsApi, coursesApi, facultyApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'

interface AcademicTerm {
  id: number
  name: string
  code: string
}

interface Course {
  id: number
  name: string
  code: string
}

interface Faculty {
  id: number
  fullName?: string
  firstName?: string
  lastName?: string
}

interface CourseOffering {
  id: number
  courseId: number
  courseName: string
  courseCode: string
  termId: number
  termName: string
  termCode: string
  facultyProfileId: number
  facultyName: string
  section: string
  capacity: number
  enrolledCount: number
  availableSeats: number
  schedule?: string
  location?: string
  isActive: boolean
  isFull: boolean
  createdAt: string
}

export default function CourseOfferingsPage() {
  const [offerings, setOfferings] = useState<CourseOffering[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])

  const [selectedTermId, setSelectedTermId] = useState<number | undefined>()
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>()
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    offeringId: number | null
    offeringName: string
  }>({
    isOpen: false,
    offeringId: null,
    offeringName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchFilterData = async () => {
    try {
      const [termRes, courseRes, facultyRes] = await Promise.all([
        academicTermsApi.getAll(),
        coursesApi.getAll(),
        facultyApi.getAll(),
      ])
      setTerms(termRes.data || [])
      setCourses(courseRes.data || [])
      setFaculties(facultyRes.data || [])
    } catch (err) {
      console.error('Failed to fetch filter data:', err)
    }
  }

  const fetchSeqRef = useRef(0)

  const fetchOfferings = async () => {
    const mySeq = ++fetchSeqRef.current
    try {
      setLoading(true)
      setError(null)
      const response = await courseOfferingsApi.getAll({
        termId: selectedTermId,
        courseId: selectedCourseId,
        facultyProfileId: selectedFacultyId,
        search: search || undefined,
        page,
        pageSize,
      })
      if (mySeq !== fetchSeqRef.current) return
      const data = response.data
      setOfferings(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      if (mySeq !== fetchSeqRef.current) return
      console.error('Failed to fetch course offerings:', err)
      setError(err.message || 'Failed to load course offerings')
    } finally {
      if (mySeq === fetchSeqRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchFilterData()
  }, [])

  useEffect(() => {
    fetchOfferings()
  }, [selectedTermId, selectedCourseId, selectedFacultyId, search, page, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedTermId, selectedCourseId, selectedFacultyId, search, pageSize])

  const handleDelete = async () => {
    if (!deleteModal.offeringId) return

    try {
      setIsDeleting(true)
      await courseOfferingsApi.delete(deleteModal.offeringId)
      setDeleteModal({ isOpen: false, offeringId: null, offeringName: '' })
      fetchOfferings()
    } catch (err: any) {
      console.error('Failed to delete course offering:', err)
      alert(err.message || 'Failed to delete course offering')
    } finally {
      setIsDeleting(false)
    }
  }

  const getAvailabilityBadge = (enrolled: number, capacity: number) => {
    const isFull = enrolled >= capacity
    return (
      <span
        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}
      >
        {enrolled}/{capacity}
      </span>
    )
  }

  const facultyLabel = (f: Faculty) =>
    f.fullName || `${f.firstName || ''} ${f.lastName || ''}`.trim() || `Faculty #${f.id}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Offerings</h1>
          <p className="text-gray-600 mt-1">Manage course offerings and sections</p>
        </div>
        <Link href="/course-offerings/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Course Offering
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by course, code, section, or faculty..."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedTermId || ''}
            onChange={(e) => setSelectedTermId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Terms</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} ({term.code})
              </option>
            ))}
          </select>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
          <select
            value={selectedFacultyId || ''}
            onChange={(e) => setSelectedFacultyId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Faculty</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {facultyLabel(f)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : offerings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No course offerings found</p>
            <Link href="/course-offerings/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
              Create your first course offering
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Term
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offerings.map((offering) => (
                    <tr key={offering.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono text-sm font-medium text-gray-900 block">
                            {offering.courseCode}
                          </span>
                          <span className="text-sm text-gray-600">{offering.courseName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{offering.termName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{offering.facultyName || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{offering.section}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{offering.schedule || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{offering.location || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAvailabilityBadge(offering.enrolledCount, offering.capacity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            offering.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {offering.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/course-offerings/${offering.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              ✏️ Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                offeringId: offering.id,
                                offeringName: `${offering.courseCode} - ${offering.section}`,
                              })
                            }
                          >
                            🗑️ Delete
                          </Button>
                        </div>
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
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, offeringId: null, offeringName: '' })}
        title="Delete Course Offering"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.offeringName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, offeringId: null, offeringName: '' })
              }
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
