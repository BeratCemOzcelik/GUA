import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const BACKEND_URL = API_URL.replace('/api', '')

// Convert relative file URLs to absolute backend URLs
export function getFileUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${BACKEND_URL}${url}`
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Departments API
export const departmentsApi = {
  getAll: async () => {
    const response = await api.get('/Departments')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/Departments/${id}`)
    return response.data
  },
}

// Programs API
export const programsApi = {
  getAll: async () => {
    const response = await api.get('/Programs')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/Programs/${id}`)
    return response.data
  },
  getByDepartment: async (departmentId: number) => {
    const response = await api.get(`/Programs/department/${departmentId}`)
    return response.data
  },
}

// Courses API
export const coursesApi = {
  getAll: async () => {
    const response = await api.get('/Courses')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/Courses/${id}`)
    return response.data
  },
  getByDepartment: async (departmentId: number) => {
    const response = await api.get(`/Courses/department/${departmentId}`)
    return response.data
  },
}

// Faculty Profiles API
export const facultyApi = {
  getAll: async () => {
    const response = await api.get('/FacultyProfiles')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/FacultyProfiles/${id}`)
    return response.data
  },
}

// Blog Posts API
export const blogApi = {
  getAll: async () => {
    const response = await api.get('/BlogPosts')
    return response.data
  },
  getBySlug: async (slug: string) => {
    const response = await api.get(`/BlogPosts/slug/${slug}`)
    return response.data
  },
}

// Gallery API
export const galleryApi = {
  getAll: async () => {
    const response = await api.get('/Gallery')
    return response.data
  },
}

// Applications API (for admissions)
export const applicationsApi = {
  submit: async (data: any) => {
    const response = await api.post('/Applications', data)
    return response.data
  },
}

// Contact API
export const contactApi = {
  send: async (data: { firstName: string; lastName: string; email: string; phone?: string; message: string }) => {
    const response = await api.post('/Contact', data)
    return response.data
  },
}

// Diploma / Transcript Verification API
export const diplomaApi = {
  verify: async (code: string) => {
    const response = await api.get(`/Transcripts/verify/${encodeURIComponent(code)}`)
    return response.data
  },
}
