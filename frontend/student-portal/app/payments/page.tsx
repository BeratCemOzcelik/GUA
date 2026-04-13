'use client'

import { useState, useEffect } from 'react'
import { paymentsApi } from '@/lib/api'

interface PaymentDto {
  id: number
  amount: number
  currency: string
  description: string
  status: string
  installmentNumber: number
  totalInstallments: number
  dueDate: string
  paymentUrl: string | null
  paidAt: string | null
}

interface PaymentSummary {
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  totalInstallments: number
  paidInstallments: number
  payments: PaymentDto[]
}

export default function PaymentsPage() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState<number | null>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      const response = await paymentsApi.getMyPayments()
      setSummary(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payments')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePay = async (paymentId: number) => {
    try {
      setPayingId(paymentId)
      const response = await paymentsApi.pay(paymentId)
      if (response.data?.paymentUrl) {
        window.open(response.data.paymentUrl, '_blank')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payment link')
    } finally {
      setPayingId(null)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      case 'Cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'Pending' && new Date(dueDate) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B1A1A]"></div>
      </div>
    )
  }

  if (!summary || summary.payments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Tuition fee payments</p>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No payment records found. Your installment plan will appear here once created by the administration.
        </div>
      </div>
    )
  }

  const progressPercent = (summary.paidInstallments / summary.totalInstallments) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Tuition fee installment plan</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Tuition</p>
          <p className="text-2xl font-bold text-gray-900">${summary.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">${summary.paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="text-2xl font-bold text-[#8B1A1A]">${summary.remainingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Progress</p>
          <p className="text-2xl font-bold text-gray-900">{summary.paidInstallments}/{summary.totalInstallments}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Payment Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-[#8B1A1A] h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Installments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summary.payments.map((payment) => {
              const nextPayable = summary.payments.find(p => p.status === 'Pending')
              const isNextToPay = nextPayable?.id === payment.id
              return (
              <tr key={payment.id} className={isOverdue(payment.dueDate, payment.status) ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {payment.installmentNumber}/{payment.totalInstallments}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{payment.description}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ${payment.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <span className={isOverdue(payment.dueDate, payment.status) ? 'text-red-600 font-semibold' : ''}>
                    {new Date(payment.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {isOverdue(payment.dueDate, payment.status) && ' (Overdue)'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {payment.paidAt
                    ? new Date(payment.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  {payment.status === 'Pending' && isNextToPay && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePay(payment.id)}
                        disabled={payingId === payment.id}
                        className="px-3 py-1 bg-[#8B1A1A] text-white text-sm rounded hover:bg-[#6d1414] disabled:opacity-50"
                      >
                        {payingId === payment.id ? 'Creating...' : 'Pay Now'}
                      </button>
                      {payment.paymentUrl && (
                        <button
                          onClick={() => handleCheckStatus(payment.id)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                        >
                          Refresh
                        </button>
                      )}
                    </div>
                  )}
                  {payment.status === 'Pending' && !isNextToPay && (
                    <span className="text-gray-400 text-sm">Locked</span>
                  )}
                  {payment.status === 'Completed' && (
                    <span className="text-green-600 text-sm">&#10003; Paid</span>
                  )}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
