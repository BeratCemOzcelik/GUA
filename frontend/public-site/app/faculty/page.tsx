'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { facultyApi, getFileUrl } from '@/lib/api'

const COMING_SOON = false

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (COMING_SOON) return
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await facultyApi.getAll()
      setFaculty(res.data || [])
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
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Our Team</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Expert Teachers</h1>
          <p className="text-lg text-gray-200">Learn from industry leaders and academic experts</p>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : faculty.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <p className="text-gray-600 text-lg">No faculty profiles available yet.</p>
            <p className="text-gray-500 text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {faculty.map((member) => (
              <Link
                key={member.id}
                href={`/faculty/${member.id}`}
                className="bg-white rounded-xl overflow-hidden card-hover border border-gray-100"
              >
                <div className="h-56 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center relative">
                  {member.photoUrl ? (
                    <img src={getFileUrl(member.photoUrl)} alt={member.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 bg-white/15 rounded-full flex items-center justify-center">
                      <svg className="w-14 h-14 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">{member.title}</h3>
                  {member.department && <p className="text-sm text-primary font-medium mt-1">{member.department}</p>}
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">{member.bio}</p>
                  <p className="text-sm text-primary font-semibold mt-3 flex items-center gap-1">
                    View Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
