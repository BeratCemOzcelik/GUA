import { GradeComponent } from '@/lib/types'

interface GradeTableProps {
  gradeComponents: GradeComponent[]
  showWeightedAverage?: boolean
  weightedAverage?: number | null
}

export default function GradeTable({ gradeComponents, showWeightedAverage = false, weightedAverage }: GradeTableProps) {
  if (!gradeComponents || gradeComponents.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No grade components available yet.</p>
      </div>
    )
  }

  const publishedComponents = gradeComponents.filter(c => c.isPublished)

  if (publishedComponents.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <p className="text-amber-800">Grades have not been published yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Component
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Weight
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Score
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Max Score
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Percentage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {publishedComponents.map((component) => {
            const percentage = component.earnedScore !== null
              ? ((component.earnedScore / component.maxScore) * 100).toFixed(1)
              : null

            return (
              <tr key={component.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {component.componentName}
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  {component.weightPercentage}%
                </td>
                <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900">
                  {component.earnedScore !== null ? component.earnedScore : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  {component.maxScore}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  {percentage !== null ? (
                    <span className={`font-semibold ${
                      parseFloat(percentage) >= 90 ? 'text-green-600' :
                      parseFloat(percentage) >= 80 ? 'text-blue-600' :
                      parseFloat(percentage) >= 70 ? 'text-amber-600' :
                      parseFloat(percentage) >= 60 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {percentage}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {showWeightedAverage && weightedAverage != null && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Weighted Average:</span>
            <span className={`text-xl font-bold ${
              weightedAverage >= 90 ? 'text-green-600' :
              weightedAverage >= 80 ? 'text-blue-600' :
              weightedAverage >= 70 ? 'text-amber-600' :
              weightedAverage >= 60 ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {weightedAverage.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
