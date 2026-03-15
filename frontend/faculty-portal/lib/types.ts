// Student Profile
export interface StudentProfile {
  id: number
  userId: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  address: string
  city: string
  country: string
  phoneNumber: string
  programId: number
  programName: string
  enrollmentDate: string
  expectedGraduationDate: string
  currentGPA: number
  totalCreditsEarned: number
  isActive: boolean
}

// Course Offering
export interface CourseOffering {
  id: number
  courseId: number
  courseCode: string
  courseName: string
  courseDescription: string
  credits: number
  termId: number
  termName: string
  section: string
  facultyId: number | null
  facultyName: string | null
  schedule: string
  location: string
  capacity: number
  enrolledCount: number
  startDate: string
  endDate: string
  isActive: boolean
  prerequisites: Prerequisite[]
}

export interface Prerequisite {
  prerequisiteCourseId: number
  prerequisiteCourseCode: string
  prerequisiteCourseName: string
}

// Enrollment
export interface Enrollment {
  id: number
  studentId: number
  courseOfferingId: number
  courseOffering: CourseOffering
  enrollmentDate: string
  status: 'Enrolled' | 'Dropped' | 'Completed'
  finalGrade: string | null
  gradePoint: number | null
  enrollmentBlock: EnrollmentBlock | null
}

export interface EnrollmentBlock {
  reason: string
  blockedAt: string
}

// Grade Component
export interface GradeComponent {
  id: number
  enrollmentId: number
  componentName: string
  weightPercentage: number
  maxScore: number
  earnedScore: number | null
  isPublished: boolean
  gradedAt: string | null
}

// Enrollment with Grades
export interface EnrollmentWithGrades {
  enrollment: Enrollment
  gradeComponents: GradeComponent[]
  weightedAverage: number | null
  finalLetterGrade: string | null
}

// Transcript
export interface TranscriptData {
  student: StudentProfile
  termRecords: TermRecord[]
  cumulativeGPA: number
  totalCreditsEarned: number
  totalCreditsAttempted: number
}

export interface TermRecord {
  termId: number
  termName: string
  courses: TranscriptCourse[]
  termGPA: number
  termCreditsEarned: number
  termCreditsAttempted: number
}

export interface TranscriptCourse {
  courseCode: string
  courseName: string
  credits: number
  grade: string
  gradePoint: number
}

// Academic Term
export interface AcademicTerm {
  id: number
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

// Department
export interface Department {
  id: number
  name: string
  code: string
}

// Dashboard Stats
export interface DashboardStats {
  currentGPA: number
  totalCreditsEarned: number
  coursesInProgress: number
  currentEnrollments: Enrollment[]
}

// Course Material
export interface CourseMaterial {
  id: number
  courseId: number
  courseName: string
  courseCode: string
  courseOfferingId: number | null
  title: string
  description: string
  fileUrl: string
  fileType: string
  version: number
  uploadedByUserName: string
  isActive: boolean
  createdAt: string
}

// Assignment Submission
export interface AssignmentSubmission {
  id: number
  enrollmentId: number
  gradeComponentId: number
  gradeComponentName: string
  courseCode: string
  courseName: string
  dueDate: string | null
  maxScore: number
  weight: number
  submittedAt: string
  fileUrl: string
  fileName: string
  fileSize: number
  studentComments: string | null
  status: 'Pending' | 'Submitted' | 'Graded' | 'Late'
  statusText: string
  score: number | null
  facultyComments: string | null
  gradedAt: string | null
}
