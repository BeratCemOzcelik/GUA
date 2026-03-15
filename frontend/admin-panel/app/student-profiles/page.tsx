'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { studentProfilesApi, programsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'

interface StudentProfile {
  id: number
  userId: string
  userFullName: string
  userEmail: string
  studentNumber: string
  programId: number
  programName: string
  departmentName: string
  enrollmentDate: string
  expectedGraduationDate?: string
  currentGPA: number
  totalCreditsEarned: number
  academicStatus: string
  academicStatusText: string
  address?: string
  city?: string
  country?: string
  dateOfBirth?: string
  age: number
  createdAt: string
}

interface Program {
  id: number
  name: string
}

export default function StudentProfilesPage() {
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<StudentProfile[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    profileId: number | null
    studentName: string
  }>({
    isOpen: false,
    profileId: null,
    studentName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // Filters
  const [filterProgram, setFilterProgram] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const fetchStudentProfiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await studentProfilesApi.getAll()
      setStudentProfiles(response.data || [])
      setFilteredProfiles(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch student profiles:', err)
      setError(err.message || 'Failed to load student profiles')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await programsApi.getAll()
      setPrograms(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch programs:', err)
    }
  }

  useEffect(() => {
    fetchStudentProfiles()
    fetchPrograms()
  }, [])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...studentProfiles]

    // Filter by program
    if (filterProgram) {
      filtered = filtered.filter(profile => profile.programId.toString() === filterProgram)
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(profile => profile.academicStatus === filterStatus)
    }

    // Search by student number or name
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(profile =>
        profile.studentNumber.toLowerCase().includes(query) ||
        profile.userFullName.toLowerCase().includes(query)
      )
    }

    setFilteredProfiles(filtered)
  }, [filterProgram, filterStatus, searchQuery, studentProfiles])

  const handleDelete = async () => {
    if (!deleteModal.profileId) return

    try {
      setIsDeleting(true)
      await studentProfilesApi.delete(deleteModal.profileId)
      setDeleteModal({ isOpen: false, profileId: null, studentName: '' })
      fetchStudentProfiles()
    } catch (err: any) {
      console.error('Failed to delete student profile:', err)
      alert(err.message || 'Failed to delete student profile')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'OnProbation':
        return 'bg-yellow-100 text-yellow-800'
      case 'Suspended':
        return 'bg-red-100 text-red-800'
      case 'Graduated':
        return 'bg-blue-100 text-blue-800'
      case 'Withdrawn':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Profiles</h1>
          <p className="text-gray-600 mt-1">Manage student information and academic records</p>
        </div>
        <Link href="/student-profiles/create">
          <Button>
            <span className="mr-2">➕</span>
            Add Student Profile
          </Button>
        </Link>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by student number or name..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
          >
            <option value="">All Programs</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="OnProbation">On Probation</option>
            <option value="Suspended">Suspended</option>
            <option value="Graduated">Graduated</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No student profiles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
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
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{profile.studentNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{profile.userFullName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {profile.userEmail}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{profile.programName}</div>
                        <div className="text-xs text-gray-500">{profile.departmentName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{profile.currentGPA.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{profile.totalCreditsEarned}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(profile.academicStatus)}`}
                      >
                        {profile.academicStatusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/student-profiles/${profile.id}/edit`}>
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
                              profileId: profile.id,
                              studentName: profile.userFullName,
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
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, profileId: null, studentName: '' })}
        title="Delete Student Profile"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the student profile for <strong>{deleteModal.studentName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() =>
                setDeleteModal({ isOpen: false, profileId: null, studentName: '' })
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
