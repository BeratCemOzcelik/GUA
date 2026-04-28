'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { departmentsApi, programsApi, facultyApi } from '@/lib/api'

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const numericTarget = parseInt(target.replace(/[^0-9]/g, ''))

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0
          const duration = 2000
          const step = Math.ceil(numericTarget / (duration / 16))
          const timer = setInterval(() => {
            start += step
            if (start >= numericTarget) {
              setCount(numericTarget)
              clearInterval(timer)
            } else {
              setCount(start)
            }
          }, 16)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [numericTarget])

  return <div ref={ref} className="text-4xl md:text-5xl font-bold text-gold">{count}{suffix}</div>
}

const departmentIcons: Record<string, string> = {
  'Psychology': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  'Engineering': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  'Economy': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Political Science': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'Fine Arts': 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z',
  'Sport': 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const defaultIcon = 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'

const testimonials = [
  {
    name: 'Emily Carter',
    program: 'Business Administration',
    text: 'Studying at Global University America completely changed my perspective on education. The online learning system is smooth and interactive, and the professors truly care about student success. I was able to balance my studies with work seamlessly.',
  },
  {
    name: 'Sofia Ramirez',
    program: 'International Relations',
    text: 'At Global University America, our students come from all around the world, united by one goal — to achieve excellence. The cultural diversity and global network I have built here are invaluable. I truly feel prepared for an international career.',
  },
  {
    name: 'Ahmed Hassan',
    program: 'Engineering',
    text: 'The flexibility of the programs allowed me to study from my home country while accessing world-class education. The digital platform is modern, the faculty is supportive, and the accreditation gives me confidence in my degree.',
  },
]

const faqItems = [
  {
    question: 'Is Global University America internationally accredited?',
    answer: 'Yes, Global University America holds full accreditation from recognized international accreditation bodies. Our degrees are valid and recognized worldwide, ensuring our graduates can pursue careers and further education globally.',
  },
  {
    question: 'Can I study online from another country?',
    answer: 'Absolutely! All of our degree programs are fully accessible online from anywhere in the world. Students can participate in live virtual lectures, access course materials 24/7, and collaborate with peers globally through our digital learning platform.',
  },
  {
    question: 'What kind of support does Global University America provide for students?',
    answer: 'We provide comprehensive support including academic advising, career coaching, 24/7 technical assistance, and a personalized digital student ID. Our student services team is always available to help with any questions or concerns.',
  },
  {
    question: 'What programs does Global University America offer?',
    answer: 'We offer a wide range of programs across six departments: Psychology, Engineering, Economy, Political Science, Fine Arts, and Sports. Our programs include Associate, Bachelor\'s, Master\'s, and Doctoral degrees designed for both online and hybrid learning.',
  },
]

export default function HomePage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [faculty, setFaculty] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const INTRO_VIDEO_URL = process.env.NEXT_PUBLIC_INTRO_VIDEO_URL || ''

  const sliderImages = [
    '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES.png',
    '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES-2.png',
    '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES-5.png',
    '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES-6.png',
    '/slider/INTERNATIONAL-ACCREDITATION-CENTER-OF-THE-UNITED-STATES-7.png',
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [deptRes, progRes, facRes] = await Promise.all([
        departmentsApi.getAll(),
        programsApi.getAll(),
        facultyApi.getAll(),
      ])
      setDepartments(deptRes.data || [])
      setPrograms(progRes.data || [])
      setFaculty(facRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-overlay absolute inset-0"></div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Welcome to Global University America</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15]">
                Getting Quality Education Is Now More Easy
              </h1>
              <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-lg">
                Join thousands of students from around the world who trust Global University America for flexible, affordable, and globally recognized education. Learn from expert faculty and gain skills to shape your future from anywhere worldwide.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/programs" className="px-8 py-3.5 bg-gold text-navy font-bold rounded-lg hover:bg-gold-light transition-all shadow-lg hover:shadow-xl">
                  Explore Programs
                </Link>
                <Link href="/apply" className="px-8 py-3.5 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-primary transition-all">
                  Apply Now
                </Link>
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="px-8 py-3.5 bg-white/10 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-primary transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Watch Intro Video
                </button>
              </div>
            </div>
            <div className="flex justify-center animate-fade-in">
              <div className="relative">
                <div className="absolute -inset-4 bg-gold/20 rounded-full blur-2xl"></div>
                <Image src="/logo-large.jpg" alt="Global University America" width={380} height={380} className="relative rounded-full shadow-2xl ring-4 ring-gold/30" priority />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white relative -mt-1">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 -mt-16 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <AnimatedCounter target="12000" suffix="k+" />
                <p className="text-sm text-gray-600 mt-2 font-medium">Students Globally</p>
              </div>
              <div>
                <AnimatedCounter target="350" suffix="+" />
                <p className="text-sm text-gray-600 mt-2 font-medium">Courses Available</p>
              </div>
              <div>
                <AnimatedCounter target="50" suffix="+" />
                <p className="text-sm text-gray-600 mt-2 font-medium">Expert Instructors</p>
              </div>
              <div>
                <AnimatedCounter target="24000" suffix="k+" />
                <p className="text-sm text-gray-600 mt-2 font-medium">Certified Graduates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accreditation Slider */}
      <section className="py-10 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs text-gray-500 font-semibold tracking-widest uppercase mb-6">Internationally Accredited</p>
          <div className="overflow-hidden">
            <div className="flex items-center animate-scroll">
              {[...sliderImages, ...sliderImages].map((img, index) => (
                <div key={index} className="flex-shrink-0 px-8" style={{ width: '220px' }}>
                  <Image src={img} alt={`Accreditation ${(index % sliderImages.length) + 1}`} width={180} height={50} className="object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Explore Courses / Departments */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-3">Academic Excellence</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Explore Courses</h2>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">Discover our diverse range of departments offering world-class programs designed for the global learner.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const programCount = programs.filter(p => p.departmentId === dept.id).length
                const iconPath = departmentIcons[dept.name] || defaultIcon
                return (
                  <Link
                    key={dept.id}
                    href={`/departments/${dept.id}`}
                    className="group bg-white rounded-xl p-7 border border-gray-100 card-hover"
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                      <svg className="w-7 h-7 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{dept.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{dept.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-semibold">{programCount > 0 ? `${programCount} Programs` : 'View Details'}</span>
                      <svg className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Faculty */}
      {faculty.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-4">
              <div>
                <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-3">Our Team</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Expert Teachers</h2>
              </div>
              <Link href="/faculty" className="px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-semibold text-sm hover:bg-primary hover:text-white transition-all">
                View All Faculty
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {faculty.slice(0, 6).map((member) => (
                <Link
                  key={member.id}
                  href={`/faculty/${member.id}`}
                  className="bg-white rounded-xl overflow-hidden card-hover border border-gray-100"
                >
                  <div className="h-52 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center relative">
                    {member.profileImageUrl ? (
                      <img src={member.profileImageUrl} alt={member.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-24 h-24 bg-white/15 rounded-full flex items-center justify-center">
                        <svg className="w-14 h-14 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg">{member.title}</h3>
                    {member.department && <p className="text-sm text-primary font-medium mt-1">{member.department}</p>}
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{member.bio}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Students Say About Us</h2>
          </div>

          <div className="relative">
            <div className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-100">
              <svg className="w-10 h-10 text-gold mb-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 italic">
                &ldquo;{testimonials[activeTestimonial].text}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonials[activeTestimonial].name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</p>
                  <p className="text-sm text-gray-500">{testimonials[activeTestimonial].program}</p>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-primary w-8' : 'bg-gray-300 hover:bg-gray-400'}`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="bg-primary rounded-2xl p-10 md:p-14 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="text-7xl md:text-8xl font-bold text-gold mb-2">2012</div>
                <p className="text-xl text-gray-200 mb-8">Established</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-gold">6+</div>
                    <div className="text-sm text-gray-300 mt-1">Departments</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-gold">12k+</div>
                    <div className="text-sm text-gray-300 mt-1">Students</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-gold">50+</div>
                    <div className="text-sm text-gray-300 mt-1">Faculty</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-gold">100%</div>
                    <div className="text-sm text-gray-300 mt-1">Online</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-3">Who We Are</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Empowering Minds, Connecting the World
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Global University America is an innovative higher education institution
                providing access to quality learning for students across the world.
                Through cutting-edge digital platforms and globally accredited programs,
                we empower individuals to gain the skills, knowledge, and connections needed
                to thrive in an interconnected world.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  'International Accreditation',
                  'Digital Student ID',
                  'Global Online Learning',
                  'International Partnerships',
                  'Career Development Support',
                  'Learning Technology',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-sm">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <svg className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`faq-answer ${openFaq === i ? 'open' : ''}`}>
                  <p className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">Start Your Academic Journey Today</h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Take the first step towards a world-class education. Apply now and join our global community of learners from every corner of the world.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="px-8 py-3.5 bg-gold text-navy font-bold rounded-lg hover:bg-gold-light transition-all shadow-lg">
              Apply Now
            </Link>
            <Link href="/contact" className="px-8 py-3.5 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-navy transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Intro Video Modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setVideoOpen(false)}
        >
          <button
            type="button"
            onClick={() => setVideoOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {INTRO_VIDEO_URL ? (
              <video
                src={INTRO_VIDEO_URL}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[75vh] rounded-lg shadow-2xl"
              />
            ) : (
              <div className="bg-white rounded-lg p-10 text-center">
                <p className="text-gray-700">The intro video hasn&apos;t been uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
