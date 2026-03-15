'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Who We Are</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Global University America</h1>
          <p className="text-lg text-gray-200">Empowering Minds, Connecting the World</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <div>
            <div className="inline-block bg-primary text-gold text-7xl font-bold px-8 py-6 rounded-2xl mb-8">2012</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              Global University America is an innovative higher education institution
              providing access to quality learning for students across the world.
              Through cutting-edge digital platforms and globally accredited programs,
              we empower individuals to gain the skills, knowledge, and connections needed
              to thrive in an interconnected world.
            </p>
            <p className="text-gray-700 leading-relaxed mb-5">
              Our programs are designed to combine the flexibility of remote
              learning with the value of in-person academic engagement. Our students
              can study from anywhere while also participating in live virtual classes,
              workshops, and on-campus experiences designed to enhance global
              collaboration and real-world application.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our mission is simple yet powerful: to make world-class education accessible
              to everyone, everywhere. With international partnerships, experienced faculty, and a modern
              curriculum, our students graduate prepared to lead in a rapidly evolving
              global landscape.
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-5">Our Features</h3>
              <div className="space-y-4">
                {[
                  { label: 'International Accreditation', desc: 'Globally recognized programs and degrees valid worldwide' },
                  { label: 'Digital Student ID', desc: 'Modern digital identity system for all students' },
                  { label: 'Global Online Learning', desc: 'Study from anywhere in the world, 24/7 access' },
                  { label: 'International Partnerships', desc: 'Collaborate with institutions across the globe' },
                  { label: 'Career Development Support', desc: 'Professional guidance, coaching, and career pathways' },
                  { label: 'Learning Technology', desc: 'Cutting-edge digital platforms and tools' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{feature.label}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gold">12k+</div>
                <p className="text-sm text-gray-200 mt-1">Students</p>
              </div>
              <div className="bg-primary rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gold">6+</div>
                <p className="text-sm text-gray-200 mt-1">Departments</p>
              </div>
              <div className="bg-primary rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gold">350+</div>
                <p className="text-sm text-gray-200 mt-1">Courses</p>
              </div>
              <div className="bg-primary rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gold">50+</div>
                <p className="text-sm text-gray-200 mt-1">Faculty</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-3">Our Purpose</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Mission & Vision</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-gray-100 card-hover">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To make world-class education accessible to everyone, everywhere.
                We are committed to providing flexible, affordable, and globally recognized
                programs that empower students from all backgrounds to achieve their
                academic and professional goals.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-gray-100 card-hover">
              <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To be a leading global institution that bridges education and opportunity,
                connecting students from diverse backgrounds with world-class learning
                experiences, career pathways, and a vibrant international community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accreditation */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-3">Recognition</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Internationally Accredited</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES.png',
              '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES-2.png',
              '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES-5.png',
            ].map((img, i) => (
              <Image key={i} src={img} alt="Accreditation" width={160} height={60} className="object-contain" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">Ready to Join Us?</h2>
          <p className="text-lg text-gray-300 mb-8">Start your learning journey today at Global University America</p>
          <Link href="/apply" className="inline-block px-8 py-3.5 bg-gold text-navy font-bold rounded-lg hover:bg-gold-light transition-all shadow-lg">
            Apply Now
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
