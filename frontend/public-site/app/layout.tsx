import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

const SITE_URL = 'https://gua.edu.pl'
const SITE_NAME = 'Global University of America'
const GA_MEASUREMENT_ID = 'G-TCQ8GQ1YGB'
const SITE_SHORT = 'GUA'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} (${SITE_SHORT}) — Accredited Online University`,
    template: `%s | ${SITE_NAME}`,
  },
  description: `${SITE_NAME} (${SITE_SHORT}) offers accredited online bachelor, master, and doctorate programs in psychology, business, political science, and more. Study from anywhere in the world.`,
  keywords: [
    'Global University of America',
    'GUA',
    'GUA university',
    'gua.edu.pl',
    'online university',
    'accredited online degree',
    'online bachelor degree',
    'online master degree',
    'online doctorate',
    'psychology degree online',
    'business degree online',
    'political science degree online',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} (${SITE_SHORT}) — Accredited Online University`,
    description: `Accredited online programs in psychology, business, political science, and more. Study from anywhere.`,
    images: [
      {
        url: '/logo-large.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} (${SITE_SHORT})`,
    description: 'Accredited online programs. Study from anywhere.',
    images: ['/logo-large.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logo-round.png',
    apple: '/logo-round.png',
  },
  verification: {
    // Google Search Console doğrulama yapıldıktan sonra buraya kod girilecek:
    // google: 'xxxxxxxxxxxxxxxxxx',
  },
  category: 'education',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B1A1A',
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollegeOrUniversity',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: [SITE_SHORT, 'GUA University', 'Global University America'],
  url: SITE_URL,
  logo: `${SITE_URL}/logo-large.png`,
  image: `${SITE_URL}/logo-large.png`,
  description: `${SITE_NAME} is an accredited online university offering bachelor, master, and doctorate programs in psychology, business, political science, and more.`,
  sameAs: [
    'https://www.instagram.com/globaluniversityamerica',
    'https://www.facebook.com/share/1BKQRFFcNu/',
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '21 Overlook Ridge Terrace no:332',
    addressLocality: 'Revere',
    addressRegion: 'MA',
    postalCode: '02151',
    addressCountry: 'US',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+1-339-226-1362',
      contactType: 'Admissions',
      email: 'edu@gua.edu.pl',
      availableLanguage: ['English'],
    },
  ],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: SITE_SHORT,
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/programs?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </html>
  )
}
