'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { notificationsApi } from '@/lib/api'
import Pagination from '@/components/Pagination'
import ConfirmModal from '@/components/ConfirmModal'

interface Notification {
  id: number
  title: string
  message: string
  type: string
  actionUrl: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    load()
  }, [filter, page, pageSize])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [filter])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [listRes, countRes] = await Promise.all([
        notificationsApi.getMine({
          unreadOnly: filter === 'unread',
          page,
          pageSize,
        }),
        notificationsApi.getUnreadCount(),
      ])
      setItems(listRes.data?.items ?? [])
      setTotalCount(listRes.data?.totalCount ?? 0)
      setUnreadCount(countRes.data ?? 0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await notificationsApi.markRead(n.id)
        setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // ignore
      }
    }
    if (n.actionUrl) router.push(n.actionUrl)
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number, wasUnread: boolean) => {
    e.stopPropagation()
    try {
      await notificationsApi.delete(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      setTotalCount((c) => Math.max(0, c - 1))
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete notification')
    }
  }

  const handleClearAll = async () => {
    setConfirmClear(false)
    try {
      await notificationsApi.deleteAll()
      setItems([])
      setTotalCount(0)
      setUnreadCount(0)
      setPage(1)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear notifications')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Updates about student submissions and your courses</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-[#8B1A1A] text-white text-sm rounded hover:bg-[#6d1414]"
            >
              Mark all as read
            </button>
          )}
          {totalCount > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-4 py-2 bg-white border border-red-300 text-red-700 text-sm rounded hover:bg-red-50"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            filter === 'all' ? 'border-[#8B1A1A] text-[#8B1A1A]' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            filter === 'unread' ? 'border-[#8B1A1A] text-[#8B1A1A]' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread {unreadCount > 0 && <span className="ml-1 text-xs bg-[#8B1A1A] text-white rounded-full px-2 py-0.5">{unreadCount}</span>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B1A1A]"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-100">
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`group flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition cursor-pointer ${!n.isRead ? 'bg-red-50/30' : ''}`}
              >
                {!n.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-[#8B1A1A] flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(n.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n.id, !n.isRead)}
                  aria-label="Delete notification"
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition flex-shrink-0 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmClear}
        title="Clear all notifications?"
        message="This will permanently delete all your notifications. This action cannot be undone."
        confirmText="Clear all"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
