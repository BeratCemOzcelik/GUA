'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

interface CourseMaterial {
  id: number
  title: string
  description: string
  fileUrl: string
  fileType: string
  version: number
  courseCode: string
  courseName: string
  createdAt: string
  uploadedByUserName: string
}

export default function MaterialsPage() {
  const searchParams = useSearchParams()
  const courseOfferingId = searchParams?.get('courseOfferingId')

  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (courseOfferingId) {
      loadMaterials()
    }
  }, [courseOfferingId])

  const loadMaterials = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/CourseMaterials/course-offering/${courseOfferingId}`)
      setMaterials(response.data.data || [])
    } catch (err) {
      console.error('Load materials error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !title || !courseOfferingId) {
      alert('Please fill all fields')
      return
    }

    try {
      setUploading(true)

      // Upload file first
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'course-materials')

      const uploadRes = await api.post('/Files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const fileUrl = uploadRes.data.data.fileUrl

      // Extract file type from file name
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown'

      // Create course material record
      await api.post('/CourseMaterials', {
        courseOfferingId: parseInt(courseOfferingId),
        title,
        description,
        fileUrl,
        fileType: fileExtension,
      })

      alert('Material uploaded successfully!')
      setTitle('')
      setDescription('')
      setFile(null)
      loadMaterials()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload material')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  if (!courseOfferingId) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
        Please select a course from My Courses to upload materials.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Course Materials</h1>

      {/* Upload Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload New Material</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
              placeholder="e.g., Lecture 1 - Introduction"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
              placeholder="Brief description of the material"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File *
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted: PDF, PPT, DOC, XLS, ZIP (Max 10MB)
            </p>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-[#8B1A1A] text-white rounded-lg font-semibold hover:bg-[#6B1414] transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Material'}
          </button>
        </form>
      </div>

      {/* Materials List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Uploaded Materials</h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No materials uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{material.title}</h3>
                  {material.description && (
                    <p className="text-xs text-gray-600 mt-1">{material.description}</p>
                  )}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span>{material.fileType.toUpperCase()}</span>
                    <span>•</span>
                    <span>v{material.version}</span>
                    <span>•</span>
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/files/download?fileUrl=${encodeURIComponent(material.fileUrl)}`}
                  className="px-4 py-2 bg-[#8B1A1A] text-white rounded-lg text-sm font-semibold hover:bg-[#6B1414] transition-colors"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
