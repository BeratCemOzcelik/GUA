'use client'

import { useState, useEffect, useRef } from 'react'
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

const POLL_INTERVAL_MS = 60_000

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function NotificationBell() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [recent, setRecent] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const fetchCount = async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      setUnreadCount(res.data ?? 0)
    } catch {
      // silent — polling will retry
    }
  }

  const openDropdown = async () => {
    setOpen(true)
    setLoading(true)
    try {
      const res = await notificationsApi.getMine({ pageSize: 5 })
      setRecent(res.data?.items ?? [])
    } catch {
      setRecent([])
    } finally {
      setLoading(false)
    }
  }

  const toggle = () => {
    if (open) setOpen(false)
    else openDropdown()
  }

  const handleClick = async (n: Notification) => {
    setOpen(false)
    if (!n.isRead) {
      try {
        await notificationsApi.markRead(n.id)
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // ignore
      }
    }
    if (n.actionUrl) router.push(n.actionUrl)
    else router.push('/notifications')
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setUnreadCount(0)
      setRecent((items) => items.map((i) => ({ ...i, isRead: true })))
    } catch {
      // ignore
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 text-gray-700 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[#8B1A1A] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-[#8B1A1A] hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-500 text-sm">Loading...</div>
            ) : recent.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">No notifications yet</div>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${!n.isRead ? 'bg-red-50/30' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-[#8B1A1A] flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false)
              router.push('/notifications')
            }}
            className="w-full text-center px-4 py-3 text-sm font-medium text-[#8B1A1A] hover:bg-gray-50 border-t border-gray-100"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
