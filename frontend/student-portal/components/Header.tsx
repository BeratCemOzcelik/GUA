'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ name: 'Home', href: '/dashboard' }]

    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/')
      const name = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      breadcrumbs.push({ name, href })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'text-[#8B1A1A] font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }
              >
                {crumb.name}
              </span>
            </div>
          ))}
        </div>

        {/* Welcome Message */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="text-sm font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="w-10 h-10 bg-[#8B1A1A] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
