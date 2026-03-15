'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { departmentsApi, programsApi } from '@/lib/api'

const deptColors = [
  'from-primary to-primary-dark',
  'from-navy to-navy-light',
  'from-primary to-navy',
  'from-navy to-primary',
  'from-primary-dark to-primary',
  'from-navy-light to-navy',
]

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [deptRes, progRes] = await Promise.all([
        departmentsApi.getAll(),
        programsApi.getAll(),
      ])
      setDepartments(deptRes.data || [])
      setPrograms(progRes.data || [])
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Academic Excellence</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Departments</h1>
          <p className="text-lg text-gray-200">Explore our diverse academic departments</p>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => {
              const programCount = programs.filter(p => p.departmentId === dept.id).length
              return (
                <Link
                  key={dept.id}
                  href={`/departments/${dept.id}`}
                  className="group bg-white rounded-xl overflow-hidden card-hover border border-gray-100"
                >
                  <div className={`h-3 bg-gradient-to-r ${deptColors[index % deptColors.length]}`}></div>
                  <div className="p-7">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                      <svg className="w-7 h-7 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{dept.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{dept.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-semibold">{programCount} Programs available</span>
                      <svg className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
