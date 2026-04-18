'use client'

import { useState, useEffect, useRef } from 'react'
import { applicationsApi, programsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'

interface Application {
  id: number
  applicantName: string
  applicantEmail: string
  phoneNumber?: string
  programName: string
  status: string
  submittedAt: string
  reviewedAt?: string
  notes?: string
  rejectionReason?: string
  createdAt: string
}

interface Program {
  id: number
  name: string
}

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-800',
  Submitted: 'bg-blue-100 text-blue-800',
  UnderReview: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Withdrawn: 'bg-purple-100 text-purple-800',
}

const statusOptions = ['Draft', 'Submitted', 'UnderReview', 'Approved', 'Rejected', 'Withdrawn']

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [programs, setPrograms] = useState<Program[]>([])

  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProgramId, setFilterProgramId] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean
    application: Application | null
  }>({ isOpen: false, application: null })
  const [newStatus, setNewStatus] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean
    application: Application | null
  }>({ isOpen: false, application: null })
  const [approvalResult, setApprovalResult] = useState<{
    isOpen: boolean
    studentNumber?: string
    password?: string
    paymentPlan?: boolean
    message?: string
    userAlreadyExists?: boolean
    autoCreationFailed?: boolean
    variant?: 'success' | 'warning' | 'error'
  }>({ isOpen: false })

  const fetchSeqRef = useRef(0)

  const fetchApplications = async () => {
    const mySeq = ++fetchSeqRef.current
    try {
      setLoading(true)
      setError(null)
      const response = await applicationsApi.getAll({
        status: filterStatus || undefined,
        programId: filterProgramId,
        search: search || undefined,
        page,
        pageSize,
      })
      if (mySeq !== fetchSeqRef.current) return
      const data = response.data
      setApplications(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      if (mySeq !== fetchSeqRef.current) return
      console.error('Failed to fetch applications:', err)
      setError(err.message || 'Failed to load applications')
    } finally {
      if (mySeq === fetchSeqRef.current) setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const res = await programsApi.getAll()
      setPrograms(res.data || [])
    } catch (err) {
      console.error('Failed to fetch programs:', err)
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [filterStatus, filterProgramId, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterProgramId, search, pageSize])

  const handleStatusUpdate = async () => {
    if (!statusModal.application || !newStatus) return
    try {
      setIsUpdating(true)
      const response = await applicationsApi.updateStatus(statusModal.application.id, {
        status: newStatus,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason : undefined,
      })
      setStatusModal({ isOpen: false, application: null })
      setNewStatus('')
      setRejectionReason('')
      fetchApplications()

      if (newStatus === 'Approved' && response.data) {
        const result = response.data
        if (result.studentCreated) {
          setApprovalResult({
            isOpen: true,
            studentNumber: result.studentNumber,
            password: result.generatedPassword,
            paymentPlan: result.paymentPlanCreated,
            message: result.message,
            variant: 'success',
          })
        } else if (result.userAlreadyExists) {
          setApprovalResult({
            isOpen: true,
            userAlreadyExists: true,
            message: result.message,
            variant: 'warning',
          })
        } else if (result.autoCreationFailed) {
          setApprovalResult({
            isOpen: true,
            autoCreationFailed: true,
            message: result.message,
            variant: 'error',
          })
        }
      }
    } catch (err: any) {
      console.error('Failed to update status:', err)
      alert(err.message || 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">Manage student applications</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, or phone..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filterProgramId || ''}
            onChange={(e) => setFilterProgramId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No applications found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{app.applicantName}</p>
                          <p className="text-sm text-gray-500">{app.applicantEmail}</p>
                          {app.phoneNumber && <p className="text-sm text-gray-400">{app.phoneNumber}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{app.programName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            statusColors[app.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetailModal({ isOpen: true, application: app })}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setStatusModal({ isOpen: true, application: app })
                              setNewStatus(app.status)
                              setRejectionReason(app.rejectionReason || '')
                            }}
                          >
                            Update
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

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, application: null })}
        title="Application Details"
      >
        {detailModal.application && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{detailModal.application.applicantName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{detailModal.application.applicantEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{detailModal.application.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-medium">{detailModal.application.programName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    statusColors[detailModal.application.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {detailModal.application.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium">
                  {new Date(detailModal.application.submittedAt || detailModal.application.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {detailModal.application.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="mt-1 text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3 text-sm">
                  {detailModal.application.notes}
                </p>
              </div>
            )}
            {detailModal.application.rejectionReason && (
              <div>
                <p className="text-sm text-gray-500">Rejection Reason</p>
                <p className="mt-1 text-red-700 bg-red-50 rounded-lg p-3 text-sm">
                  {detailModal.application.rejectionReason}
                </p>
              </div>
            )}
            {detailModal.application.reviewedAt && (
              <div>
                <p className="text-sm text-gray-500">Reviewed At</p>
                <p className="font-medium">{new Date(detailModal.application.reviewedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => {
          setStatusModal({ isOpen: false, application: null })
          setNewStatus('')
          setRejectionReason('')
        }}
        title="Update Application Status"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Update status for <strong>{statusModal.application?.applicantName}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {newStatus === 'Rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] resize-none"
                placeholder="Reason for rejection..."
              />
            </div>
          )}
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setStatusModal({ isOpen: false, application: null })
                setNewStatus('')
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} isLoading={isUpdating}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approval Result Modal */}
      <Modal
        isOpen={approvalResult.isOpen}
        onClose={() => setApprovalResult({ isOpen: false })}
        title={
          approvalResult.variant === 'warning'
            ? 'User Already Exists'
            : approvalResult.variant === 'error'
            ? 'Auto-Creation Failed'
            : 'Student Account Created'
        }
      >
        <div className="space-y-4">
          <div
            className={`flex items-center justify-center w-16 h-16 mx-auto rounded-full ${
              approvalResult.variant === 'warning'
                ? 'bg-amber-100'
                : approvalResult.variant === 'error'
                ? 'bg-red-100'
                : 'bg-green-100'
            }`}
          >
            {approvalResult.variant === 'warning' ? (
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
              </svg>
            ) : approvalResult.variant === 'error' ? (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-center text-gray-700">{approvalResult.message}</p>

          {approvalResult.variant === 'success' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Student Number</span>
                  <span className="font-mono font-bold text-gray-900">{approvalResult.studentNumber}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Password</span>
                  <span className="font-mono font-bold text-[#8B1A1A]">{approvalResult.password}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Payment Plan</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      approvalResult.paymentPlan ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {approvalResult.paymentPlan ? '6 Installments Created' : 'No Tuition Fee'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-center text-gray-500">
                Login credentials have been sent to the student&apos;s email.
              </p>
            </>
          )}

          {approvalResult.variant === 'warning' && (
            <p className="text-sm text-center text-gray-500">
              The application status was updated, but no new student account was created because a user with this email
              already exists. Check the Users page to link the existing account manually if needed.
            </p>
          )}

          {approvalResult.variant === 'error' && (
            <p className="text-sm text-center text-gray-500">
              The status was updated, but automatic creation was rolled back. You can retry by switching the status away
              and back to Approved, or create the student manually.
            </p>
          )}

          <div className="flex justify-center">
            <Button onClick={() => setApprovalResult({ isOpen: false })}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
