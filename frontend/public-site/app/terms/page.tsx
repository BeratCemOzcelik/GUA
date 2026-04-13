'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms & Conditions</h1>
          <p className="text-lg text-gray-200">Last Updated: October 2025</p>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 leading-relaxed">

          <p>
            Welcome to <strong>Global University America (GUA)</strong>. By accessing or using our website, online learning platform, or any of our services, you agree to comply with and be bound by the following Terms and Conditions. Please read these terms carefully before using our services.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By enrolling in our programs, creating an account, or using any service provided by Global University America, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. If you do not agree with any part of these terms, you must not use our website or services.
          </p>

          <h2>2. Institution Overview</h2>
          <p>
            Global University America operates as an international online and hybrid higher education institution. Our programs are designed to provide academic instruction, research opportunities, and professional development to students across the world.
          </p>

          <h2>3. Eligibility</h2>
          <p>To access our programs or register for courses, you must:</p>
          <ul>
            <li>Be at least 18 years of age or meet the legal age requirement in your country.</li>
            <li>Provide accurate and verifiable information during registration.</li>
            <li>Agree to comply with academic and institutional policies throughout your studies.</li>
          </ul>

          <h2>4. Use of Services</h2>
          <p>You agree to use our website and learning platform only for lawful and educational purposes. You must not:</p>
          <ul>
            <li>Engage in any activity that disrupts or damages the platform.</li>
            <li>Attempt to gain unauthorized access to any part of the system.</li>
            <li>Copy, distribute, or modify any course material without permission from the university.</li>
          </ul>

          <h2>5. Enrollment and Payment</h2>
          <p>
            Tuition fees, payment terms, and refund policies are outlined during the enrollment process and in official communication from the university. By enrolling, you agree to pay all applicable fees within the deadlines provided. Failure to meet financial obligations may result in suspension of access to the learning platform or withdrawal from courses.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            All content on the Global University America website and learning platform, including but not limited to text, graphics, videos, logos, and course materials, is the intellectual property of the university or its content partners. Unauthorized reproduction, distribution, or commercial use of any material is strictly prohibited.
          </p>

          <h2>7. Academic Integrity</h2>
          <p>
            Global University America maintains strict academic standards. Students are expected to uphold honesty and integrity in all academic work. Plagiarism, cheating, or falsification of information may lead to disciplinary actions, including expulsion and revocation of academic recognition.
          </p>

          <h2>8. Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Personal data collected during registration or throughout your academic journey is processed in accordance with our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. We do not sell, trade, or share your personal information with third parties except where required by law or to deliver academic services.
          </p>

          <h2>9. Online and Hybrid Learning Policy</h2>
          <p>
            Global University America provides online and hybrid learning options. Course access, submission of assignments, and communication with faculty are conducted primarily through our digital platform. Students are responsible for maintaining a stable internet connection and keeping their login credentials confidential.
          </p>

          <h2>10. Disclaimer</h2>
          <p>
            While we strive to ensure the accuracy and availability of our services, Global University America does not guarantee that the website or platform will be uninterrupted or error free. The university is not responsible for any losses resulting from temporary outages, technical issues, or third party service disruptions.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            Global University America shall not be held liable for any indirect, incidental, or consequential damages arising from the use or inability to use our services. Our total liability, under any circumstance, will not exceed the total amount paid by the student for the course or program in question.
          </p>

          <h2>12. Changes to Terms</h2>
          <p>
            The university reserves the right to modify or update these Terms and Conditions at any time. Updated versions will be posted on our official website with a new effective date. Continued use of our services after any changes constitutes your acceptance of the revised terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms and Conditions are governed by the applicable laws of the United States. Any disputes arising under or in connection with these terms shall be resolved in accordance with the laws and regulations of the jurisdiction where the university is legally registered.
          </p>

          <h2>14. Contact Information</h2>
          <p>For any questions or concerns regarding these Terms and Conditions, please contact us at:</p>
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
