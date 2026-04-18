'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import StatCard from '@/components/ui/StatCard'
import {
  departmentsApi,
  programsApi,
  coursesApi,
  usersApi,
  applicationsApi,
  auditLogsApi,
} from '@/lib/api'

interface DashboardStats {
  departments: number
  programs: number
  courses: number
  users: number
  applications: number
}

interface AuditLog {
  id: number
  userEmail: string
  action: string
  entityName: string
  entityId: string
  timestamp: string
}

const actionIcons: Record<string, string> = {
  Create: '➕',
  Update: '✏️',
  Delete: '🗑️',
  Login: '🔑',
  Logout: '🚪',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [userName] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('user') || '{}').firstName || '' } catch { return '' }
    }
    return ''
  })
  const [stats, setStats] = useState<DashboardStats>({
    departments: 0,
    programs: 0,
    courses: 0,
    users: 0,
    applications: 0,
  })
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [departmentsRes, programsRes, coursesRes, usersRes, applicationsRes, auditRes] =
          await Promise.all([
            departmentsApi.getAll(),
            programsApi.getAll(),
            coursesApi.getAll(),
            usersApi.getAll({ pageSize: 1 }),
            applicationsApi.getAll({ pageSize: 1 }).catch(() => ({ data: { totalCount: 0 } })),
            auditLogsApi.getAll(1, 10).catch(() => ({ data: [] })),
          ])

        setStats({
          departments: departmentsRes.data?.length || 0,
          programs: programsRes.data?.length || 0,
          courses: coursesRes.data?.length || 0,
          users: usersRes.data?.totalCount || 0,
          applications: applicationsRes.data?.totalCount || 0,
        })

        setRecentActivity(auditRes.data || [])
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    // Check user state or localStorage token (handles race condition after login)
    const hasAuth = user || (typeof window !== 'undefined' && localStorage.getItem('accessToken'))
    if (hasAuth) {
      fetchData()
    }
  }, [user])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#8B1A1A] to-[#660000] rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {user?.firstName || userName}!
        </h1>
        <p className="text-white/90">
          Welcome to the GUA Admin Panel. Here&apos;s an overview of your system.
        </p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Departments"
          value={stats.departments}
          icon="🏢"
          color="#8B1A1A"
          loading={loading}
        />
        <StatCard
          title="Programs"
          value={stats.programs}
          icon="🎓"
          color="#2563EB"
          loading={loading}
        />
        <StatCard
          title="Courses"
          value={stats.courses}
          icon="📚"
          color="#059669"
          loading={loading}
        />
        <StatCard
          title="Users"
          value={stats.users}
          icon="👥"
          color="#7C3AED"
          loading={loading}
        />
        <StatCard
          title="Applications"
          value={stats.applications}
          icon="📋"
          color="#DC2626"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/departments"
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium text-gray-900">Add Department</span>
          </a>
          <a
            href="/programs"
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium text-gray-900">Add Program</span>
          </a>
          <a
            href="/applications"
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="text-2xl">📋</span>
            <span className="font-medium text-gray-900">View Applications</span>
          </a>
          <a
            href="/blog"
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <span className="text-2xl">✍️</span>
            <span className="font-medium text-gray-900">Create Blog Post</span>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <a href="/audit-logs" className="text-sm text-[#8B1A1A] hover:underline font-medium">
            View All
          </a>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B1A1A]"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No recent activity to display
            </div>
          ) : (
            recentActivity.map(log => (
              <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{actionIcons[log.action] || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    <span className="text-gray-500">{log.userEmail}</span>{' '}
                    {log.action.toLowerCase()}d{' '}
                    <span className="font-semibold">{log.entityName}</span>
                    {log.entityId && <span className="text-gray-400"> #{log.entityId}</span>}
                  </p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(log.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
