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
