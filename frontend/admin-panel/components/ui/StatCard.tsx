interface StatCardProps {
  title: string
  value: number | string
  icon: string
  color?: string
  loading?: boolean
}

export default function StatCard({
  title,
  value,
  icon,
  color = '#8B1A1A',
  loading = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ filter: 'grayscale(0%)' }}>{icon}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <span className="mr-2">📈</span>
          <span>Updated just now</span>
        </div>
      </div>
    </div>
  )
}
