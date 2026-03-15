'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { diplomaApi } from '@/lib/api'

interface VerificationResult {
  studentName: string
  studentNumber: string
  programName: string
  departmentName: string
  gpa: number
  totalCreditsEarned: number
  generatedAt: string
  isOfficial: boolean
  verificationCode: string
}

export default function DiplomaInquiryPage() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setStatus('loading')
    setErrorMessage('')
    setResult(null)

    try {
      const response = await diplomaApi.verify(code.trim())
      if (response.success && response.data) {
        setResult(response.data)
        setStatus('success')
      } else {
        setErrorMessage(response.message || 'Invalid verification code.')
        setStatus('error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No document found with this verification code. Please check the code and try again.'
      setErrorMessage(msg)
      setStatus('error')
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
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Verification</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Diploma / Certificate Inquiry</h1>
          <p className="text-lg text-gray-200">Verify the authenticity of diplomas, certificates, and accreditation documents</p>
        </div>
      </section>

      <section className="py-20 max-w-xl mx-auto px-4">
        <div className="bg-gray-50 rounded-2xl p-8 md:p-10 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Document</h2>
            <p className="text-sm text-gray-600">Enter your certificate, accreditation, or diploma code below to verify its authenticity.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Certificate / Accreditation / Diploma Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g., GUA-2026-12345"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white text-center text-lg font-mono tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-6 py-3.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold transition-colors shadow-sm disabled:opacity-60"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Verify Document'
              )}
            </button>
          </form>

          {status === 'error' && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5 text-center">
              <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-red-700 font-semibold">Invalid Code</p>
              <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            </div>
          )}

          {status === 'success' && result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-center mb-5">
                <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-green-700 font-bold text-lg">Document Verified</p>
                <p className="text-green-600 text-sm mt-1">This document is authentic and issued by Global University America.</p>
              </div>

              <div className="bg-white rounded-lg border border-green-200 divide-y divide-gray-100">
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Student Name</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{result.studentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Student Number</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{result.studentNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Program</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{result.programName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Department</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{result.departmentName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">GPA</p>
                    <p className="font-bold text-primary text-lg mt-0.5">{result.gpa.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Credits Earned</p>
                    <p className="font-bold text-gray-900 text-lg mt-0.5">{result.totalCreditsEarned}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Type</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{result.isOfficial ? 'Official' : 'Unofficial'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Issue Date</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{new Date(result.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Verification Code</p>
                    <p className="font-mono font-semibold text-gray-900 mt-0.5">{result.verificationCode}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? <a href="mailto:edu@gua.edu.pl" className="text-primary hover:underline font-medium">Contact us</a> for assistance.
          </p>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
