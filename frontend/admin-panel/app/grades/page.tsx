'use client'

import { useState, useEffect } from 'react'
import { gpaRecordsApi, studentProfilesApi, academicTermsApi, courseOfferingsApi, finalGradesApi } from '@/lib/api'

export default function GradesPage() {
  const [activeTab, setActiveTab] = useState<'gpa' | 'finals'>('gpa')
  const [gpaRecords, setGpaRecords] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [offerings, setOfferings] = useState<any[]>([])
  const [finalGrades, setFinalGrades] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [selectedOffering, setSelectedOffering] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [gpaRes, studentRes, termRes, offeringRes] = await Promise.all([
        gpaRecordsApi.getAll(),
        studentProfilesApi.getAll(),
        academicTermsApi.getAll(),
        courseOfferingsApi.getAll({ pageSize: 1000 }),
      ])
      setGpaRecords(gpaRes.data || [])
      setStudents(studentRes.data || [])
      setTerms(termRes.data || [])
      setOfferings(offeringRes.data?.items || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFinalGrades = async (offeringId: number) => {
    try {
      setError('')
      const res = await finalGradesApi.getByOffering(offeringId)
      setFinalGrades(res.data || [])
    } catch (err: any) {
      setFinalGrades([])
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load final grades')
      }
    }
  }

  useEffect(() => {
    if (selectedOffering) {
      loadFinalGrades(parseInt(selectedOffering))
    } else {
      setFinalGrades([])
    }
  }, [selectedOffering])

  const filteredGPA = gpaRecords.filter((r: any) => {
    if (filterStudent && !`${r.studentName || ''} ${r.studentNumber || ''}`.toLowerCase().includes(filterStudent.toLowerCase())) return false
    if (filterTerm && String(r.termId) !== filterTerm) return false
    return true
  })

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
        <h1 className="text-3xl font-bold text-gray-900">Grades & GPA</h1>
        <p className="text-gray-600 mt-1">View GPA records and final grades</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('gpa')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'gpa' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          GPA Records
        </button>
        <button
          onClick={() => setActiveTab('finals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'finals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Final Grades
        </button>
      </div>

      {/* GPA Tab */}
      {activeTab === 'gpa' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Search student..."
                value={filterStudent}
                onChange={e => setFilterStudent(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={filterTerm}
                onChange={e => setFilterTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Terms</option>
                {terms.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Term</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Term GPA</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Cumulative GPA</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Term Credits</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Total Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Calculated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGPA.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No GPA records found</td></tr>
                ) : (
                  filteredGPA.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{r.studentName}</p>
                        <p className="text-xs text-gray-500">{r.studentNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.termName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${r.termGPA >= 3.0 ? 'text-green-600' : r.termGPA >= 2.0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {(r.termGPA ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${r.cumulativeGPA >= 3.0 ? 'text-green-600' : r.cumulativeGPA >= 2.0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {(r.cumulativeGPA ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">{r.termCreditsEarned ?? 0}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">{r.totalCreditsEarned ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.calculatedAt ? new Date(r.calculatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Final Grades Tab */}
      {activeTab === 'finals' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <select
              value={selectedOffering}
              onChange={e => setSelectedOffering(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select a course offering...</option>
              {offerings.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.courseCode || ''} - {o.courseName || ''} ({o.termName || `Term ${o.termId}`}) - Section {o.section || '?'}
                </option>
              ))}
            </select>
          </div>

          {selectedOffering && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Weighted Avg</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Letter Grade</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Grade Points</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Published</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {finalGrades.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No final grades found for this offering</td></tr>
                  ) : (
                    finalGrades.map((fg: any) => (
                      <tr key={fg.id || fg.enrollmentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{fg.studentName || `Student #${fg.studentId}`}</p>
                          <p className="text-xs text-gray-500">{fg.studentNumber || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">{(fg.weightedAverage ?? fg.numericGrade ?? 0).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg font-bold ${
                            (fg.letterGrade || '').startsWith('A') ? 'text-green-600' :
                            (fg.letterGrade || '').startsWith('B') ? 'text-blue-600' :
                            (fg.letterGrade || '').startsWith('C') ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {fg.letterGrade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{(fg.gradePoints ?? 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${fg.publishedAt ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {fg.publishedAt ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {fg.publishedAt ? new Date(fg.publishedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
