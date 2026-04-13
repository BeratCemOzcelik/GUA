'use client'

import { useState, useEffect } from 'react'
import { applicationsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
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

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await applicationsApi.getAll()
      setApplications(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch applications:', err)
      setError(err.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

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

      // Show auto-creation result for approved applications
      if (newStatus === 'Approved' && response.data) {
        const result = response.data
        if (result.studentCreated) {
          alert(`Student account created!\n\nStudent Number: ${result.studentNumber}\nPassword: ${result.generatedPassword}\nPayment Plan: ${result.paymentPlanCreated ? 'Created (6 installments)' : 'No'}\n\nCredentials have been sent to the student's email.`)
        } else if (result.message) {
          alert(result.message)
        }
      }
    } catch (err: any) {
      console.error('Failed to update status:', err)
      alert(err.message || 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredApps = filterStatus
    ? applications.filter(a => a.status === filterStatus)
    : applications

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">Manage student applications</p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusOptions.map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`p-4 rounded-lg border text-left transition-all ${
              filterStatus === status
                ? 'border-[#8B1A1A] bg-[#8B1A1A]/5 ring-2 ring-[#8B1A1A]/20'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{statusCounts[status] || 0}</p>
            <p className="text-sm text-gray-600">{status}</p>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1A1A]"></div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No applications found</p>
          </div>
        ) : (
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
                {filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{app.applicantName}</p>
                        <p className="text-sm text-gray-500">{app.applicantEmail}</p>
                        {app.phoneNumber && (
                          <p className="text-sm text-gray-400">{app.phoneNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{app.programName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-800'}`}>
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
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[detailModal.application.status] || 'bg-gray-100 text-gray-800'}`}>
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
              onChange={e => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]"
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {newStatus === 'Rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
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
    </div>
  )
}
