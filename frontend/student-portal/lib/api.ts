import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

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

// Student Profile API
export const studentProfileApi = {
  getMyProfile: async () => {
    const response = await api.get('/studentprofiles/me')
    return response.data
  },
  update: async (data: any) => {
    const response = await api.put('/studentprofiles/me', data)
    return response.data
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/studentprofiles/me/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },
}

// Enrollments API
export const enrollmentsApi = {
  getAvailable: async (termId?: number, allDepartments?: boolean) => {
    const params = new URLSearchParams()
    if (termId) params.append('termId', termId.toString())
    if (allDepartments) params.append('allDepartments', 'true')
    const response = await api.get(`/enrollments/my-available-courses${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  getMyEnrollments: async (opts?: {
    termId?: number
    status?: string
    search?: string
    page?: number
    pageSize?: number
  }) => {
    const params = new URLSearchParams()
    if (opts?.termId) params.append('termId', opts.termId.toString())
    if (opts?.status) params.append('status', opts.status)
    if (opts?.search) params.append('search', opts.search)
    if (opts?.page) params.append('page', opts.page.toString())
    if (opts?.pageSize) params.append('pageSize', opts.pageSize.toString())
    const response = await api.get(`/enrollments/my-enrollments${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  enroll: async (courseOfferingId: number) => {
    const response = await api.post('/enrollments', { courseOfferingId })
    return response.data
  },
  drop: async (enrollmentId: number) => {
    const response = await api.post(`/enrollments/${enrollmentId}/drop`)
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/enrollments/${id}`)
    return response.data
  },
}

// Grades API
export const gradesApi = {
  getMyGrades: async (termId?: number) => {
    const params = new URLSearchParams()
    if (termId) params.append('termId', termId.toString())
    const response = await api.get(`/grades/my-grades${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
  getEnrollmentGrades: async (enrollmentId: number) => {
    const response = await api.get(`/grades/enrollment/${enrollmentId}`)
    return response.data
  },
  getFinalGrade: async (enrollmentId: number) => {
    const response = await api.get(`/finalgrades/enrollment/${enrollmentId}`)
    return response.data
  },
}

// Transcript API
export const transcriptApi = {
  getMyTranscript: async () => {
    const response = await api.get('/transcripts/my-transcript')
    return response.data
  },
  generate: async () => {
    const response = await api.post('/transcripts/generate')
    return response.data
  },
  getHistory: async () => {
    const response = await api.get('/transcripts/history')
    return response.data
  },
  downloadPdf: async (id: number) => {
    const response = await api.get(`/transcripts/${id}/download`, { responseType: 'blob' })
    return response
  },
}

// Academic Terms API (for filtering)
export const academicTermsApi = {
  getAll: async () => {
    const response = await api.get('/academicterms')
    return response.data
  },
  getCurrent: async () => {
    const response = await api.get('/academicterms/current')
    return response.data
  },
}

// Departments API (for filtering)
export const departmentsApi = {
  getAll: async () => {
    const response = await api.get('/departments')
    return response.data
  },
}

// Course Materials API
export const courseMaterialsApi = {
  getByCourseOffering: async (courseOfferingId: number) => {
    const response = await api.get(`/CourseMaterials/course-offering/${courseOfferingId}`)
    return response.data
  },
}

// Assignment Submissions API
export const assignmentSubmissionsApi = {
  submit: async (data: {
    gradeComponentId: number
    fileUrl: string
    fileName: string
    fileSize: number
    studentComments?: string
  }) => {
    const response = await api.post('/assignmentsubmissions', data)
    return response.data
  },
  getMySubmissions: async (courseOfferingId?: number) => {
    const params = new URLSearchParams()
    if (courseOfferingId) params.append('courseOfferingId', courseOfferingId.toString())
    const response = await api.get(`/assignmentsubmissions/my-submissions${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },
}

// Curriculum API
export const curriculumApi = {
  get: async (programId: number) => {
    const response = await api.get(`/programs/${programId}/curriculum`)
    return response.data
  },
}

// Notifications API
export const notificationsApi = {
  getMine: async (opts?: { unreadOnly?: boolean; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams()
    if (opts?.unreadOnly) params.append('unreadOnly', 'true')
    if (opts?.page) params.append('page', opts.page.toString())
    if (opts?.pageSize) params.append('pageSize', opts.pageSize.toString())
    const qs = params.toString()
    const response = await api.get(`/notifications/me${qs ? '?' + qs : ''}`)
    return response.data
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },
  markRead: async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },
  markAllRead: async () => {
    const response = await api.put('/notifications/mark-all-read')
    return response.data
  },
}

// Payments API
export const paymentsApi = {
  getMyPayments: async () => {
    const response = await api.get('/payments/my')
    return response.data
  },
  pay: async (id: number) => {
    const response = await api.post(`/payments/${id}/pay`)
    return response.data
  },
  checkStatus: async (id: number) => {
    const response = await api.post(`/payments/${id}/check-status`)
    return response.data
  },
}
