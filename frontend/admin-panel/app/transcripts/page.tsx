'use client'

import { useState, useEffect } from 'react'
import { transcriptsApi, studentProfilesApi } from '@/lib/api'

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [transcriptRes, studentRes] = await Promise.all([
        transcriptsApi.getAll(),
        studentProfilesApi.getAll(),
      ])
      setTranscripts(transcriptRes.data || [])
      setStudents(studentRes.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transcripts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedStudent) return
    try {
      setIsGenerating(true)
      setError('')
      setSuccess('')
      const res = await transcriptsApi.generate(parseInt(selectedStudent), true)
      setSuccess(`Transcript generated! Verification code: ${res.data?.hash || 'N/A'}`)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate transcript')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transcript?')) return
    try {
      setError('')
      await transcriptsApi.delete(id)
      setTranscripts(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete transcript')
    }
  }

  const handleDownload = async (id: number) => {
    try {
      setError('')
      const response = await transcriptsApi.downloadPdf(id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const contentDisposition = response.headers['content-disposition']
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `transcript_${id}.pdf`
        : `transcript_${id}.pdf`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download PDF')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transcripts</h1>
        <p className="text-gray-600 mt-1">Manage generated transcripts and verification codes</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
      )}

      {/* Generate */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Official Transcript</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Choose a student...</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.firstName || ''} {s.lastName || ''} ({s.studentNumber}) - {s.programName || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedStudent || isGenerating}
            className="px-6 py-2 bg-[#8B1A1A] text-white rounded-lg font-medium hover:bg-[#6B1414] transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{transcripts.length}</p>
          <p className="text-sm text-gray-600">Total Transcripts</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{transcripts.filter((t: any) => t.isOfficial).length}</p>
          <p className="text-sm text-gray-600">Official</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{transcripts.filter((t: any) => !t.isOfficial).length}</p>
          <p className="text-sm text-gray-600">Unofficial</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Program</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Official</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Verification Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Generated</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Generated By</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transcripts.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No transcripts generated yet</td></tr>
            ) : (
              transcripts.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{t.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{t.studentName}</p>
                    <p className="text-xs text-gray-500">{t.studentNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.programName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.isOfficial ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {t.isOfficial ? 'Official' : 'Unofficial'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{t.hash || 'N/A'}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {t.generatedAt ? new Date(t.generatedAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.generatedByName || 'N/A'}</td>
                  <td className="px-4 py-3 text-center space-x-3">
                    <button
                      onClick={() => handleDownload(t.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
