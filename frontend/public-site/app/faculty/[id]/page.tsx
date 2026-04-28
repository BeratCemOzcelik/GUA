'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { facultyApi, getFileUrl } from '@/lib/api'

export default function FacultyDetailPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  const [member, setMember] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const res = await facultyApi.getById(id)
      setMember(res.data)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Faculty member not found</h1>
          <Link href="/faculty" className="text-primary mt-4 inline-block hover:underline">Back to Faculty</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="py-6 max-w-4xl mx-auto px-4">
        <Link href="/faculty" className="text-primary text-sm inline-flex items-center gap-1 hover:text-primary-dark transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Faculty
        </Link>
      </section>

      <section className="pb-16 max-w-4xl mx-auto px-4 space-y-10">
        {/* Header — photo on the left, name + bio on the right */}
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
          <div className="w-36 h-44 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            {member.photoUrl ? (
              <img src={getFileUrl(member.photoUrl)} alt={member.title} className="w-full h-full object-cover object-top" />
            ) : (
              <svg className="w-20 h-20 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-900">{member.title}</h1>
            {member.bio && <p className="text-lg text-gray-700 mt-3 leading-relaxed">{member.bio}</p>}
            {member.department && <p className="text-primary font-medium mt-3">{member.department}</p>}

            {(member.linkedinUrl || member.instagramUrl) && (
              <div className="flex justify-center sm:justify-start gap-3 mt-5">
                {member.instagramUrl && (
                  <a href={member.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white text-gray-600 transition-all">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  </a>
                )}
                {member.linkedinUrl && (
                  <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white text-gray-600 transition-all">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detail blocks underneath, full width */}
        {(member.researchInterests || member.publications || member.officeHours) && (
          <div className="space-y-8">
            {member.researchInterests && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Research Interests</h2>
                <p className="text-gray-700 leading-relaxed">{member.researchInterests}</p>
              </div>
            )}

            {member.publications && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Publications</h2>
                <p className="text-gray-700 leading-relaxed">{member.publications}</p>
              </div>
            )}

            {member.officeHours && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Office Hours
                </h3>
                <p className="text-gray-700">{member.officeHours}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
