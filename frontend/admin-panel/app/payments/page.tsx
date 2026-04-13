'use client'

import { useState, useEffect } from 'react'
import { paymentsApi, studentProfilesApi, programsApi } from '@/lib/api'

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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentDto[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Generate installments form
  const [showForm, setShowForm] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0)
  const [customAmount, setCustomAmount] = useState<number>(0)
  const [generating, setGenerating] = useState(false)

  // Filter
  const [filterStudentId, setFilterStudentId] = useState<number | undefined>()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadPayments()
  }, [filterStudentId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [paymentsRes, studentsRes, programsRes] = await Promise.all([
        paymentsApi.getAll(),
        studentProfilesApi.getAll(),
        programsApi.getAll(),
      ])
      setPayments(paymentsRes.data || [])
      setStudents(studentsRes.data || [])
      setPrograms(programsRes.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPayments = async () => {
    try {
      const res = await paymentsApi.getAll(filterStudentId)
      setPayments(res.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payments')
    }
  }

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudentId(studentId)
    const student = students.find(s => s.id === studentId)
    if (student) {
      const program = programs.find(p => p.id === student.programId)
      setCustomAmount(program?.tuitionFee || 0)
    }
  }

  const handleGenerate = async () => {
    if (!selectedStudentId || customAmount <= 0) return
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
      await loadPayments()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate installments')
    } finally {
      setGenerating(false)
    }
  }

  const handleCheckStatus = async (paymentId: number) => {
    try {
      await paymentsApi.checkStatus(paymentId)
      await loadPayments()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check status')
    }
  }

  const handleDeleteStudentPayments = async (studentId: number) => {
    if (!confirm('Are you sure you want to delete all payments for this student?')) return
    try {
      await paymentsApi.deleteStudentPayments(studentId)
      setSuccess('Payments deleted')
      await loadPayments()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete payments')
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

  // Students that don't have payments yet
  const studentsWithoutPayments = students.filter(
    s => !payments.some(p => p.studentId === s.id)
  )

  // Group payments by student
  const studentIds = [...new Set(payments.map(p => p.studentId))]

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
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">&times;</button>
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
                {studentsWithoutPayments.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.studentNumber} - {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
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

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Student:</label>
          <select
            value={filterStudentId || ''}
            onChange={(e) => setFilterStudentId(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
          >
            <option value="">All Students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.studentNumber} - {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Expected</p>
          <p className="text-2xl font-bold text-gray-900">
            ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">
            ${payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            ${payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Students with Plans</p>
          <p className="text-2xl font-bold text-gray-900">{studentIds.length}</p>
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
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
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Check Status
                          </button>
                        )}
                        {payment.installmentNumber === 1 && (
                          <button
                            onClick={() => handleDeleteStudentPayments(payment.studentId)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Delete All
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
      </div>
    </div>
  )
}
