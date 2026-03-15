import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Global University America - Quality Education Accessible Globally',
  description: 'Global University America provides access to quality learning for students across the world through cutting-edge digital platforms and globally accredited programs.',
  keywords: 'global university, online education, accredited programs, psychology, engineering, economy, political science, fine arts, sports',
  openGraph: {
    title: 'Global University America',
    description: 'Getting Quality Education Is Now More Easy',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}
