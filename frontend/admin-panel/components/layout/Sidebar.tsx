'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  name: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Departments', href: '/departments', icon: '🏢' },
  { name: 'Programs', href: '/programs', icon: '🎓' },
  { name: 'Courses', href: '/courses', icon: '📚' },
  { name: 'Academic Terms', href: '/academic-terms', icon: '📅' },
  { name: 'Blog Posts', href: '/blog', icon: '✍️' },
  { name: 'Gallery', href: '/gallery', icon: '🖼️' },
  { name: 'Users', href: '/users', icon: '👥' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#8B1A1A] rounded-lg flex items-center justify-center text-white font-bold text-xl">
            G
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">GUA</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? 'bg-[#8B1A1A] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
            <div className="w-10 h-10 bg-[#8B1A1A] rounded-full flex items-center justify-center text-white font-bold">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <span>🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </aside>
  )
}
