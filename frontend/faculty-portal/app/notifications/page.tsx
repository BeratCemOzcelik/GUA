'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { notificationsApi } from '@/lib/api'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    load()
  }, [filter])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await notificationsApi.getMine({
        unreadOnly: filter === 'unread',
        pageSize: 100,
      })
      setItems(res.data?.items ?? [])
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
    } catch {
      // ignore
    }
  }

  const unreadCount = items.filter((i) => !i.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Updates about student submissions and your courses</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-[#8B1A1A] text-white text-sm rounded hover:bg-[#6d1414]"
          >
            Mark all as read
          </button>
        )}
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
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
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition ${!n.isRead ? 'bg-red-50/30' : ''}`}
            >
              <div className="flex items-start gap-3">
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
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
