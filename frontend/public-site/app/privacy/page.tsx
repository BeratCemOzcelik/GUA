'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-200">Last Updated: October 2025</p>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 leading-relaxed">

          <p>
            Global University America (GUA) is committed to protecting the privacy, security, and confidentiality of our students, faculty members, and visitors. This Privacy Policy explains how we collect, use, store, and protect personal information gathered through our website, online learning platform, and associated services.
          </p>
          <p>
            By using our website or enrolling in any of our programs, you agree to the terms of this Privacy Policy.
          </p>

          <h2>1. Information We Collect</h2>
          <p>Global University America may collect the following types of information:</p>
          <h3>a. Personal Information</h3>
          <ul>
            <li>Full name</li>
            <li>Date of birth</li>
            <li>Nationality</li>
            <li>Contact information (email address, phone number, mailing address)</li>
            <li>Academic records and documents submitted for enrollment</li>
            <li>Payment and billing information</li>
          </ul>
          <h3>b. Non-Personal Information</h3>
          <ul>
            <li>Browser type, IP address, and operating system</li>
            <li>Pages visited, time spent, and platform activity</li>
            <li>Cookies and analytics data collected through web tracking tools</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information collected for the following purposes:</p>
          <ul>
            <li>Processing student enrollment and course registration</li>
            <li>Providing access to academic resources and learning platforms</li>
            <li>Communicating important updates and notifications</li>
            <li>Managing student fees, scholarships, and financial aid</li>
            <li>Supporting academic assessment, accreditation, and certification</li>
            <li>Improving website performance and student experience</li>
            <li>Fulfilling legal obligations and institutional policies</li>
          </ul>

          <h2>3. Data Storage and Security</h2>
          <p>
            Global University America uses industry-standard security measures to protect personal information from unauthorized access, loss, or misuse. All sensitive data is stored on secure servers with encryption and regular system audits. Access to personal data is restricted to authorized personnel and academic staff who require it for operational purposes only.
          </p>

          <h2>4. Cookies and Tracking Technologies</h2>
          <p>
            Our website uses cookies to enhance user experience, monitor performance, and analyze web traffic. You may choose to disable cookies in your browser settings; however, some website features may not function properly without them.
          </p>

          <h2>5. Information Sharing and Disclosure</h2>
          <p>
            Global University America does not sell, rent, or trade personal information to third parties. We may share data only under the following circumstances:
          </p>
          <ul>
            <li>With trusted partners or service providers who assist us in delivering educational services (such as hosting, payment processing, or accreditation bodies)</li>
            <li>When required by law, regulation, or valid legal process</li>
            <li>To protect the rights, property, or safety of the university community</li>
          </ul>
          <p>
            All third-party partners are bound by confidentiality agreements and are required to maintain the same level of data protection.
          </p>

          <h2>6. Student Rights and Access</h2>
          <p>As a student or user, you have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction or deletion of inaccurate data</li>
            <li>Withdraw consent for data processing where applicable</li>
            <li>Request a portable copy of your personal information</li>
          </ul>
          <p>
            Requests can be made in writing to the Data Protection Office at <a href="mailto:privacy@gua.edu.pl" className="text-primary hover:underline">privacy@gua.edu.pl</a>.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to fulfill academic, legal, and administrative purposes. Student academic records may be kept permanently for institutional reference and credential verification.
          </p>

          <h2>8. International Data Transfers</h2>
          <p>
            As a global institution, Global University America operates in multiple countries. By using our services, you acknowledge that your data may be transferred and processed outside your home country and in jurisdictions that may have different data protection laws. We ensure all international data transfers comply with applicable privacy regulations and use secure transfer mechanisms.
          </p>

          <h2>9. Communication and Marketing</h2>
          <p>
            We may contact you via email or messaging platforms for academic updates, event invitations, or institutional announcements. You may opt out of non-essential communications at any time by selecting the unsubscribe option or contacting us directly in writing.
          </p>

          <h2>10. Third-Party Links</h2>
          <p>
            Our website may contain links to external websites. Global University America is not responsible for the privacy practices or content of these sites. We strongly recommend reviewing the privacy policies of any external websites you visit.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            Global University America reserves the right to modify or update this Privacy Policy at any time. Changes will be published on our official website with an updated effective date. Continued use of our services after such updates constitutes acceptance of the revised policy.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions, requests, or concerns about this Privacy Policy, please contact us in writing:
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 not-prose">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Global University America</h3>
            <div className="space-y-2 text-gray-700">
              <p>Email: <a href="mailto:edu@gua.edu.pl" className="text-primary hover:underline">edu@gua.edu.pl</a></p>
              <p>Website: <span className="text-gray-900">www.gua.edu.pl</span></p>
              <p>Address: 21 Overlook Ridge Terrace no:332, Revere/Massachusetts, U.S.A 02151</p>
            </div>
          </div>

        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
