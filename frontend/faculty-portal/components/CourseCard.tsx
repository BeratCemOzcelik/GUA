import { CourseOffering } from '@/lib/types'

interface CourseCardProps {
  course: CourseOffering
  action?: React.ReactNode
  showPrerequisites?: boolean
}

export default function CourseCard({ course, action, showPrerequisites = false }: CourseCardProps) {
  if (!course) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">Course information not available</p>
      </div>
    )
  }

  const hasCapacityInfo = course?.enrolledCount != null && course?.capacity != null
  const isFull = hasCapacityInfo && (course.enrolledCount ?? 0) >= (course.capacity ?? 0)
  const availableSeats = hasCapacityInfo ? (course.capacity ?? 0) - (course.enrolledCount ?? 0) : 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{course.courseCode}</h3>
            {(course.credits ?? 0) > 0 && (
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {course.credits} Credits
              </span>
            )}
          </div>
          <p className="text-gray-900 font-medium mb-1">{course.courseName}</p>
          {course.courseDescription && (
            <p className="text-sm text-gray-600 line-clamp-2">{course.courseDescription}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="text-gray-600 w-24">Section:</span>
          <span className="text-gray-900 font-medium">{course.section}</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-600 w-24">Term:</span>
          <span className="text-gray-900 font-medium">{course.termName}</span>
        </div>
        {course.facultyName && (
          <div className="flex items-center text-sm">
            <span className="text-gray-600 w-24">Faculty:</span>
            <span className="text-gray-900 font-medium">{course.facultyName}</span>
          </div>
        )}
        {course.schedule && (
          <div className="flex items-center text-sm">
            <span className="text-gray-600 w-24">Schedule:</span>
            <span className="text-gray-900 font-medium">{course.schedule}</span>
          </div>
        )}
        {course.location && (
          <div className="flex items-center text-sm">
            <span className="text-gray-600 w-24">Location:</span>
            <span className="text-gray-900 font-medium">{course.location}</span>
          </div>
        )}
        {hasCapacityInfo && (
          <div className="flex items-center text-sm">
            <span className="text-gray-600 w-24">Capacity:</span>
            <span className={`font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
              {course.enrolledCount} / {course.capacity}
              {isFull ? ' (Full)' : ` (${availableSeats} seats available)`}
            </span>
          </div>
        )}
      </div>

      {showPrerequisites && course.prerequisites && course.prerequisites.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-900 mb-1">Prerequisites Required:</p>
          <div className="space-y-1">
            {course.prerequisites.map((prereq) => (
              <p key={prereq.prerequisiteCourseId} className="text-xs text-amber-800">
                {prereq.prerequisiteCourseCode} - {prereq.prerequisiteCourseName}
              </p>
            ))}
          </div>
        </div>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
