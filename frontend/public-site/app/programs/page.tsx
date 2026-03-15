'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { departmentsApi, programsApi } from '@/lib/api'

export default function ProgramsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [selectedDept, setSelectedDept] = useState<number | null>(null)
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
      const progs = progRes.data || []
      setPrograms(progs)
      setFilteredPrograms(progs)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterByDept = (deptId: number | null) => {
    setSelectedDept(deptId)
    if (deptId === null) {
      setFilteredPrograms(programs)
    } else {
      setFilteredPrograms(programs.filter(p => p.departmentId === deptId))
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
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Academics</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Academic Programs</h1>
          <p className="text-lg text-gray-200">Find the right program for your career goals</p>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4">
        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => filterByDept(null)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedDept === null ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Programs
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => filterByDept(dept.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedDept === dept.id ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <p className="text-gray-600 text-lg">No programs found.</p>
            <p className="text-gray-500 text-sm mt-1">Try selecting a different department.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPrograms.map((prog) => {
              const dept = departments.find(d => d.id === prog.departmentId)
              return (
                <Link key={prog.id} href={`/programs/${prog.id}`}
                  className="bg-white rounded-xl p-7 card-hover border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{prog.name}</h3>
                    {prog.degreeType && (
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full flex-shrink-0 ml-3">{prog.degreeType}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{prog.code}{dept ? ` · ${dept.name}` : ''}</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{prog.description}</p>
                  <p className="text-sm text-primary font-semibold mt-4 flex items-center gap-1">
                    Learn more
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </p>
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
