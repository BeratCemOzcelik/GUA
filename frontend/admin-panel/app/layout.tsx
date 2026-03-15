'use client'

import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './globals.css'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const isAuthPage = pathname?.startsWith('/auth')
  const isRootPage = pathname === '/'

  // Redirect to dashboard if logged in and on root page
  useEffect(() => {
    if (!isLoading && user && isRootPage) {
      router.push('/dashboard')
    }
  }, [user, isLoading, isRootPage, router])

  // Redirect to login if not logged in and not on auth page
  useEffect(() => {
    if (!isLoading && !user && !isAuthPage && !isRootPage) {
      const token = localStorage.getItem('accessToken')
      const savedUser = localStorage.getItem('user')
      if (!token || !savedUser) {
        router.push('/auth/login')
      }
    }
  }, [user, isLoading, isAuthPage, isRootPage, router])

  // Redirect to dashboard if logged in and on auth page
  useEffect(() => {
    if (!isLoading && user && isAuthPage) {
      router.push('/dashboard')
    }
  }, [user, isLoading, isAuthPage, router])

  // Show auth pages without sidebar
  if (isAuthPage || isRootPage) {
    return <>{children}</>
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting (check localStorage as fallback for race condition)
  if (!user) {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken')
    if (!hasToken) return null
  }

  // Show admin layout with sidebar
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  )
}
