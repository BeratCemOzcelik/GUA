'use client'

import { useState, useEffect } from 'react'
import { auditLogsApi } from '@/lib/api'
import Button from '@/components/ui/Button'

interface AuditLog {
  id: number
  userId: string
  userEmail: string
  action: string
  entityName: string
  entityId: string
  oldValue?: string
  newValue?: string
  timestamp: string
  ipAddress?: string
}

const actionColors: Record<string, string> = {
  Create: 'bg-green-100 text-green-800',
  Update: 'bg-blue-100 text-blue-800',
  Delete: 'bg-red-100 text-red-800',
  Login: 'bg-yellow-100 text-yellow-800',
  Logout: 'bg-gray-100 text-gray-800',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const pageSize = 30

  const fetchLogs = async (p: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await auditLogsApi.getAll(p, pageSize)
      setLogs(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err)
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(page)
  }, [page])

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">Track all system activities and changes</p>
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
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(log => (
                  <>
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {log.userEmail}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {log.entityName}
                        {log.entityId && <span className="text-gray-400 ml-1">#{log.entityId}</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(log.oldValue || log.newValue) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          >
                            {expandedId === log.id ? 'Hide' : 'View'}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.oldValue && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Old Value</p>
                                <pre className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                                  {(() => { try { return JSON.stringify(JSON.parse(log.oldValue), null, 2) } catch { return log.oldValue } })()}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">New Value</p>
                                <pre className="text-xs bg-green-50 border border-green-200 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                                  {(() => { try { return JSON.stringify(JSON.parse(log.newValue), null, 2) } catch { return log.newValue } })()}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {page} - Showing {logs.length} entries
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < pageSize}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
