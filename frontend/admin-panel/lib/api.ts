import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const BASE_URL = API_URL.replace('/api', '')

export function getFileUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${BASE_URL}${path}`
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken')

        if (refreshToken) {
          try {
            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data.data

            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', newRefreshToken)

            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          } catch (refreshError) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            window.location.href = '/auth/login'
          }
        } else {
          window.location.href = '/auth/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Departments API
export const departmentsApi = {
  getAll: async () => {
    const response = await api.get('/departments')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/departments/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/departments', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/departments/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/departments/${id}`)
    return response.data
  },
}

// Programs API
export const programsApi = {
  getAll: async () => {
    const response = await api.get('/programs')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/programs/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/programs', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/programs/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/programs/${id}`)
    return response.data
  },
}

// Courses API
export const coursesApi = {
  getAll: async () => {
    const response = await api.get('/courses')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/courses/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/courses', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/courses/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/courses/${id}`)
    return response.data
  },
}

// Blog Posts API
export const blogApi = {
  getAll: async () => {
    const response = await api.get('/blogposts')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/blogposts/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/blogposts', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/blogposts/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/blogposts/${id}`)
    return response.data
  },
  publish: async (id: number) => {
    const response = await api.post(`/blogposts/${id}/publish`)
    return response.data
  },
  unpublish: async (id: number) => {
    const response = await api.post(`/blogposts/${id}/unpublish`)
    return response.data
  },
}

// Gallery API
export const galleryApi = {
  getAll: async () => {
    const response = await api.get('/gallery')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/gallery/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/gallery', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/gallery/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/gallery/${id}`)
    return response.data
  },
}

// Users API
export const usersApi = {
  getAll: async () => {
    const response = await api.get('/users')
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/users', data)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },
  assignRoles: async (id: string, roleNames: string[]) => {
    const response = await api.post(`/users/${id}/roles`, { roleNames })
    return response.data
  },
  search: async (query: string) => {
    const response = await api.get(`/users/search?query=${query}`)
    return response.data
  },
}

// Course Materials API
export const courseMaterialsApi = {
  getAll: async () => {
    const response = await api.get('/coursematerials')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/coursematerials/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/coursematerials', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/coursematerials/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/coursematerials/${id}`)
    return response.data
  },
}

// Files API
export const filesApi = {
  upload: async (file: File, folder: string = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  delete: async (fileUrl: string) => {
    const response = await api.delete('/files', { params: { fileUrl } })
    return response.data
  },
  getConfig: async () => {
    const response = await api.get('/files/config')
    return response.data
  },
}

// Faculty Profiles API
export const facultyApi = {
  getAll: async () => {
    const response = await api.get('/facultyprofiles')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/facultyprofiles/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/facultyprofiles', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/facultyprofiles/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/facultyprofiles/${id}`)
    return response.data
  },
}

// Academic Terms API
export const academicTermsApi = {
  getAll: async () => {
    const response = await api.get('/academicterms')
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/academicterms/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/academicterms', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/academicterms/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/academicterms/${id}`)
    return response.data
  },
}

// Course Offerings API
export const courseOfferingsApi = {
  getAll: async (termId?: number, courseId?: number) => {
    const params = new URLSearchParams()
    if (termId) params.append('termId', termId.toString())
    if (courseId) params.append('courseId', courseId.toString())
    const response = await api.get(`/courseofferings${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/courseofferings/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/courseofferings', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/courseofferings/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/courseofferings/${id}`)
    return response.data
  },
}

// Applications API
export const applicationsApi = {
  getAll: async () => {
    const response = await api.get('/applications')
    return response.data
  },
  updateStatus: async (id: number, data: { status: string; rejectionReason?: string }) => {
    const response = await api.put(`/applications/${id}/status`, data)
    return response.data
  },
}

// Audit Logs API
export const auditLogsApi = {
  getAll: async (page: number = 1, pageSize: number = 50) => {
    const response = await api.get(`/auditlogs?page=${page}&pageSize=${pageSize}`)
    return response.data
  },
}

// Enrollments API
export const enrollmentsApi = {
  getAll: async (studentId?: number, courseOfferingId?: number, status?: string) => {
    const params = new URLSearchParams()
    if (studentId) params.append('studentId', studentId.toString())
    if (courseOfferingId) params.append('courseOfferingId', courseOfferingId.toString())
    if (status) params.append('status', status)
    const response = await api.get(`/enrollments${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/enrollments/${id}`)
    return response.data
  },
}

// Grades API
export const gradesApi = {
  getEnrollmentGrades: async (enrollmentId: number) => {
    const response = await api.get(`/grades/enrollment/${enrollmentId}`)
    return response.data
  },
}

// Final Grades API
export const finalGradesApi = {
  getByOffering: async (courseOfferingId: number) => {
    const response = await api.get(`/finalgrades?courseOfferingId=${courseOfferingId}`)
    return response.data
  },
}

// GPA Records API
export const gpaRecordsApi = {
  getAll: async (studentId?: number, termId?: number) => {
    const params = new URLSearchParams()
    if (studentId) params.append('studentId', studentId.toString())
    if (termId) params.append('termId', termId.toString())
    const response = await api.get(`/gparecords${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  getByStudent: async (studentId: number) => {
    const response = await api.get(`/gparecords/student/${studentId}`)
    return response.data
  },
}

// Transcripts API
export const transcriptsApi = {
  getAll: async (studentId?: number) => {
    const params = new URLSearchParams()
    if (studentId) params.append('studentId', studentId.toString())
    const response = await api.get(`/transcripts${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  generate: async (studentId: number, isOfficial: boolean = true) => {
    const response = await api.post('/transcripts/admin-generate', { studentId, isOfficial })
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/transcripts/${id}`)
    return response.data
  },
  downloadPdf: async (id: number) => {
    const response = await api.get(`/transcripts/${id}/download`, { responseType: 'blob' })
    return response
  },
}

// Student Profiles API
export const studentProfilesApi = {
  getAll: async (programId?: number, status?: string) => {
    const params = new URLSearchParams()
    if (programId) params.append('programId', programId.toString())
    if (status) params.append('status', status)
    const response = await api.get(`/studentprofiles${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/studentprofiles/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/studentprofiles', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/studentprofiles/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/studentprofiles/${id}`)
    return response.data
  },
}

// Payments API
export const paymentsApi = {
  getAll: async (studentId?: number) => {
    const params = new URLSearchParams()
    if (studentId) params.append('studentId', studentId.toString())
    const response = await api.get(`/payments${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  generateInstallments: async (data: { studentId: number; amount: number; currency?: string }) => {
    const response = await api.post('/payments/generate-installments', { currency: 'USD', type: 1, description: 'Tuition', ...data })
    return response.data
  },
  checkStatus: async (id: number) => {
    const response = await api.post(`/payments/${id}/check-status`)
    return response.data
  },
  deleteStudentPayments: async (studentId: number) => {
    const response = await api.delete(`/payments/student/${studentId}`)
    return response.data
  },
}
