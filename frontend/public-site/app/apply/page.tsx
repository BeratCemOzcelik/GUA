'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import Link from 'next/link'
import { departmentsApi, programsApi, applicationsApi } from '@/lib/api'

export default function ApplyPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', country: '', departmentId: '', programId: '',
    previousEducation: '', motivation: '',
  })

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
    }
  }

  const handleDeptChange = (deptId: string) => {
    setForm({ ...form, departmentId: deptId, programId: '' })
    if (deptId) {
      setFilteredPrograms(programs.filter(p => p.departmentId === parseInt(deptId)))
    } else {
      setFilteredPrograms([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await applicationsApi.submit({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        programId: parseInt(form.programId),
        notes: [form.previousEducation, form.motivation].filter(Boolean).join('\n\n---\n\n') || undefined,
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Admissions</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Apply Now</h1>
          <p className="text-lg text-gray-200">Start your learning journey at Global University America</p>
        </div>
      </section>

      <section className="py-16 max-w-3xl mx-auto px-4">
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-3">Application Submitted!</h2>
            <p className="text-green-700 mb-6">Thank you for applying to Global University America. We will review your application and get back to you via email within 48 hours.</p>
            <Link href="/" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors">
              Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
                {error}
              </div>
            )}
            {/* Personal Info */}
            <div className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                  <input type="text" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                  <input type="text" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                  <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Program Selection */}
            <div className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Program Selection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department *</label>
                  <select required value={form.departmentId} onChange={e => handleDeptChange(e.target.value)} className={inputClass}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Program *</label>
                  <select required value={form.programId} onChange={e => setForm({...form, programId: e.target.value})} className={inputClass}>
                    <option value="">Select Program</option>
                    {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Education Background */}
            <div className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                Education Background
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Previous Education</label>
                  <textarea rows={3} value={form.previousEducation} onChange={e => setForm({...form, previousEducation: e.target.value})}
                    placeholder="Tell us about your educational background..."
                    className={inputClass + " resize-none"} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivation</label>
                  <textarea rows={3} value={form.motivation} onChange={e => setForm({...form, motivation: e.target.value})}
                    placeholder="Why do you want to join Global University America?"
                    className={inputClass + " resize-none"} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark font-bold text-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
