'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { courseMaterialsApi, coursesApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'

interface Course {
  id: number
  name: string
  code: string
}

interface CourseMaterial {
  id: number
  courseId: number
  courseName: string
  title: string
  description?: string
  fileUrl: string
  fileName: string
  fileType: string
  uploadedBy: string
  version: number
  isActive: boolean
  createdAt: string
}

export default function CourseMaterialsPage() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [courses, setCourses] = useState<Course[]>([])

  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    materialId: number | null
    materialTitle: string
  }>({
    isOpen: false,
    materialId: null,
    materialTitle: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCourses = async () => {
    try {
      const res = await coursesApi.getAll()
      setCourses(res.data || [])
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    }
  }

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await courseMaterialsApi.getAll({
        courseId: selectedCourseId,
        search: search || undefined,
        page,
        pageSize,
      })
      const data = response.data
      setMaterials(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      console.error('Failed to fetch course materials:', err)
      setError(err.message || 'Failed to load course materials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [selectedCourseId, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [selectedCourseId, search, pageSize])

  const handleDelete = async () => {
    if (!deleteModal.materialId) return

    try {
      setIsDeleting(true)
      await courseMaterialsApi.delete(deleteModal.materialId)
      setDeleteModal({ isOpen: false, materialId: null, materialTitle: '' })
      fetchMaterials()
    } catch (err: any) {
      console.error('Failed to delete course material:', err)
      alert(err.message || 'Failed to delete course material')
    } finally {
      setIsDeleting(false)
    }
  }

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑'
    if (type.includes('image')) return '🖼️'
    if (type.includes('video')) return '🎥'
    if (type.includes('audio')) return '🎵'
    return '📎'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Materials</h1>
          <p className="text-gray-600 mt-1">Manage course materials and resources</p>
        </div>
        <Link href="/course-materials/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Material
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by title, description, or course..."
        />
        <div>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
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
        ) : materials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No course materials found</p>
            <Link href="/course-materials/create" className="text-[#8B1A1A] hover:underline mt-2 inline-block">
              Upload your first material
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
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
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
                  {materials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{material.courseName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span>{getFileTypeIcon(material.fileType)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{material.title}</div>
                            {material.description && (
                              <div className="text-sm text-gray-500 truncate max-w-md">
                                {material.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {material.fileType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {material.uploadedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        v{material.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            material.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {material.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/files/download?fileUrl=${encodeURIComponent(material.fileUrl)}`}
                            className="text-[#8B1A1A] hover:text-[#6B1414] font-medium transition-colors"
                          >
                            ⬇️ Download
                          </a>
                          <Link href={`/course-materials/${material.id}/edit`}>
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
                                materialId: material.id,
                                materialTitle: material.title,
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
        onClose={() => setDeleteModal({ isOpen: false, materialId: null, materialTitle: '' })}
        title="Delete Course Material"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteModal.materialTitle}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, materialId: null, materialTitle: '' })
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
