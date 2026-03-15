// Grade letter to grade point conversion
export const gradeToPoint = (grade: string | null): number | null => {
  if (!grade) return null

  const gradePoints: { [key: string]: number } = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'F': 0.0,
  }

  return gradePoints[grade] || null
}

// Get color class for grade
export const getGradeColor = (grade: string | null): string => {
  if (!grade) return 'text-gray-400'

  const gradeValue = grade.charAt(0)
  switch (gradeValue) {
    case 'A':
      return 'text-green-600'
    case 'B':
      return 'text-blue-600'
    case 'C':
      return 'text-amber-600'
    case 'D':
      return 'text-orange-600'
    case 'F':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

// Get background color class for status badge
export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Enrolled':
      return 'bg-green-100 text-green-700'
    case 'Dropped':
      return 'bg-red-100 text-red-700'
    case 'Completed':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// Format date to readable string
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format date to short string
export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Calculate percentage
export const calculatePercentage = (earned: number, max: number): number => {
  if (max === 0) return 0
  return (earned / max) * 100
}

// Get percentage color
export const getPercentageColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-green-600'
  if (percentage >= 80) return 'text-blue-600'
  if (percentage >= 70) return 'text-amber-600'
  if (percentage >= 60) return 'text-orange-600'
  return 'text-red-600'
}

// Truncate text
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number (basic)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
  return phoneRegex.test(phone)
}
