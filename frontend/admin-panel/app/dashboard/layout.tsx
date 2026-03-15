// Dashboard layout is now handled by root layout
// This file just passes through children
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
