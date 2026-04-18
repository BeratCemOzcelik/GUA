'use client'

import { useState, useEffect, useRef } from 'react'
import { paymentsApi, studentProfilesApi, programsApi } from '@/lib/api'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'

interface PaymentDto {
  id: number
  studentId: number
  studentName: string
  studentNumber: string
  amount: number
  currency: string
  description: string
  status: string
  installmentNumber: number
  totalInstallments: number
  dueDate: string
  paidAt: string | null
}

interface Student {
  id: number
  userId: string
  studentNumber: string
  firstName: string
  lastName: string
  programId: number
  programName: string
}

interface Program {
  id: number
  name: string
  tuitionFee: number
}

interface PaymentStats {
  totalExpected: number
  totalCollected: number
  totalPending: number
  studentsWithPlans: number
  totalPayments: number
}

const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed', 'Cancelled']
const EMPTY_STATS: PaymentStats = {
  totalExpected: 0,
  totalCollected: 0,
  totalPending: 0,
  studentsWithPlans: 0,
  totalPayments: 0,
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<PaymentStats>(EMPTY_STATS)
  const [eligibleStudentIds, setEligibleStudentIds] = useState<number[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0)
  const [customAmount, setCustomAmount] = useState<number>(0)
  const [generating, setGenerating] = useState(false)

  const [checkingStatusId, setCheckingStatusId] = useState<number | null>(null)
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null)

  const [filterStudentId, setFilterStudentId] = useState<number | undefined>()
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Request sequence tokens to discard stale responses (race condition guard)
  const paymentsSeqRef = useRef(0)
  const statsSeqRef = useRef(0)

  useEffect(() => {
    loadMetadata()
  }, [])

  useEffect(() => {
    loadPayments()
    loadStats()
  }, [filterStudentId, filterStatus, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [filterStudentId, filterStatus, search, pageSize])

  const loadMetadata = async () => {
    try {
      setIsLoading(true)
      const [studentsRes, programsRes, eligibleRes] = await Promise.all([
        studentProfilesApi.getAll(),
        programsApi.getAll(),
        paymentsApi.getEligibleStudents(),
      ])
      setStudents(studentsRes.data || [])
      setPrograms(programsRes.data || [])
      setEligibleStudentIds(eligibleRes.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPayments = async () => {
    const mySeq = ++paymentsSeqRef.current
    try {
      const res = await paymentsApi.getAll({
        studentId: filterStudentId,
        status: filterStatus || undefined,
        search: search || undefined,
        page,
        pageSize,
      })
      if (mySeq !== paymentsSeqRef.current) return // discard stale response
      const data = res.data
      setPayments(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      if (mySeq !== paymentsSeqRef.current) return
      setError(err.response?.data?.message || 'Failed to load payments')
    }
  }

  const loadStats = async () => {
    const mySeq = ++statsSeqRef.current
    try {
      const res = await paymentsApi.getStats({
        studentId: filterStudentId,
        status: filterStatus || undefined,
        search: search || undefined,
      })
      if (mySeq !== statsSeqRef.current) return
      setStats(res.data || EMPTY_STATS)
    } catch {
      if (mySeq !== statsSeqRef.current) return
      setStats(EMPTY_STATS)
    }
  }

  const refreshEligible = async () => {
    try {
      const res = await paymentsApi.getEligibleStudents()
      setEligibleStudentIds(res.data || [])
    } catch {}
  }

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudentId(studentId)
    const student = students.find((s) => s.id === studentId)
    if (student) {
      const program = programs.find((p) => p.id === student.programId)
      setCustomAmount(program?.tuitionFee || 0)
    }
  }

  const handleGenerate = async () => {
    if (!selectedStudentId || customAmount <= 0 || generating) return
    try {
      setGenerating(true)
      setError('')
      await paymentsApi.generateInstallments({
        studentId: selectedStudentId,
        amount: customAmount,
      })
      setSuccess('6 installments created successfully!')
      setShowForm(false)
      setSelectedStudentId(0)
      setCustomAmount(0)
      await Promise.all([loadPayments(), loadStats(), refreshEligible()])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate installments')
    } finally {
      setGenerating(false)
    }
  }

  const handleCheckStatus = async (paymentId: number) => {
    if (checkingStatusId !== null) return // guard against double-click
    try {
      setCheckingStatusId(paymentId)
      await paymentsApi.checkStatus(paymentId)
      await Promise.all([loadPayments(), loadStats()])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check status')
    } finally {
      setCheckingStatusId(null)
    }
  }

  const handleDeleteStudentPayments = async (studentId: number) => {
    if (deletingStudentId !== null) return
    if (!confirm('Are you sure you want to delete all payments for this student?')) return
    try {
      setDeletingStudentId(studentId)
      await paymentsApi.deleteStudentPayments(studentId)
      setSuccess('Payments deleted')
      await Promise.all([loadPayments(), loadStats(), refreshEligible()])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete payments')
    } finally {
      setDeletingStudentId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Failed: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Eligible students come from the unfiltered server-side endpoint (filter-independent)
  const studentsWithoutPayments = students.filter((s) => eligibleStudentIds.includes(s.id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B1A1A]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage student tuition installments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#8B1A1A] text-white rounded-lg hover:bg-[#6d1414]"
        >
          + Generate Installments
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">
            &times;
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Generate Installments Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Generate Installment Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value={0}>Select student...</option>
                {studentsWithoutPayments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentNumber} - {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
              {studentsWithoutPayments.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">All students already have payment plans.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (USD)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                min={0}
                step={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                Per installment: ${customAmount > 0 ? (customAmount / 6).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={!selectedStudentId || customAmount <= 0 || generating}
                className="px-4 py-2 bg-[#8B1A1A] text-white rounded-lg hover:bg-[#6d1414] disabled:opacity-50"
              >
                {generating ? 'Creating...' : 'Create 6 Installments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by student name, number, or description..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filterStudentId || ''}
            onChange={(e) => setFilterStudentId(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentNumber} - {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">All Statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats (server-side, reflects current filters) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Expected</p>
          <p className="text-2xl font-bold text-gray-900">${stats.totalExpected.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">${stats.totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">${stats.totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Students with Plans</p>
          <p className="text-2xl font-bold text-gray-900">{stats.studentsWithPlans}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No payments found. Click &quot;Generate Installments&quot; to create a plan for a student.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const isOverdue = payment.status === 'Pending' && new Date(payment.dueDate) < new Date()
                const isChecking = checkingStatusId === payment.id
                const isDeleting = deletingStudentId === payment.studentId
                return (
                  <tr key={payment.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                      <div className="text-xs text-gray-500">{payment.studentNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payment.installmentNumber}/{payment.totalInstallments}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                        {new Date(payment.dueDate).toLocaleDateString()}
                        {isOverdue && ' ⚠'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {payment.status === 'Pending' && (
                          <button
                            onClick={() => handleCheckStatus(payment.id)}
                            disabled={isChecking}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isChecking ? 'Checking...' : 'Check Status'}
                          </button>
                        )}
                        {payment.installmentNumber === 1 && (
                          <button
                            onClick={() => handleDeleteStudentPayments(payment.studentId)}
                            disabled={isDeleting}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete All'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  )
}
