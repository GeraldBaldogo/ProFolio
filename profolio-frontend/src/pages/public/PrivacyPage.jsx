import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

/*
 * Privacy policy and data-deletion instructions — public, at /privacy.
 *
 * Facebook (and Google, once the app is published) ask for a link to a page
 * like this before strangers can use "Continue with …". Facebook's
 * "Data deletion instructions URL" can point to /privacy#delete.
 *
 * Put the team's contact address here. Left empty, the page tells people to
 * go through their CS department instead.
 */
const CONTACT_EMAIL = ''

const UPDATED = 'October 2026'

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-20 border-t border-white/5 pt-8 mt-8">
    <h2 className="text-white font-bold text-lg sm:text-xl tracking-tight mb-3">{title}</h2>
    <div className="text-gray-400 text-sm sm:text-[15px] leading-relaxed space-y-3">{children}</div>
  </section>
)

const List = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5 marker:text-gray-600">
    {items.map((t, i) => <li key={i}>{t}</li>)}
  </ul>
)

const Contact = () => CONTACT_EMAIL
  ? <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:text-blue-300 font-medium">{CONTACT_EMAIL}</a>
  : <span className="text-gray-300">the ProFolio team, through the Computer Science department of Tomas Claudio Colleges</span>

export default function PrivacyPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Privacy · ProFolio'
    // Opening /privacy#delete should land on that section.
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
    }
    return () => { document.title = previous }
  }, [])

  return (
    <div className="min-h-screen bg-[#060612] font-sans">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" className="w-7 h-7 object-contain" />
          <span className="text-white font-black tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
        </Link>
        <button onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
          className="ml-auto flex items-center gap-2 text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="pt-4 sm:pt-8">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.15em] mb-3">Privacy</p>
          <h1 className="text-white font-bold text-3xl sm:text-4xl tracking-tight mb-3">Your data in ProFolio</h1>
          <p className="text-gray-500 text-sm">Last updated {UPDATED}</p>
          <p className="text-gray-400 text-sm sm:text-[15px] leading-relaxed mt-5">
            ProFolio is a skills-assessment and portfolio platform built as an undergraduate thesis project
            for Computer Science students. This page explains what it stores, why, who can see it, and how
            to have it deleted.
          </p>
        </div>

        <Section id="collect" title="What we store">
          <List items={[
            'Your account: name, email address, role (student, professor or admin) and a scrambled (hashed) password. We never store your password in readable form.',
            'What you add to your profile and portfolio: photo, contact details, education, skills, projects, certifications and experience.',
            'Your assessment work: answers, scores, rubric feedback, and any faculty review of them.',
            'Integrity events during timed assessments, such as switching tabs, pasting, or the camera not seeing a face. The camera video itself is checked inside your browser and is never uploaded or saved.',
            'Messages you send to, or receive from, professors inside ProFolio.',
          ]} />
        </Section>

        <Section id="social" title="Signing in with Google, Facebook or GitHub">
          <p>
            If you choose “Continue with Google”, “Continue with Facebook” or “Continue with GitHub”, we
            receive only your<span className="text-gray-300"> name and email address</span>, to create or find
            your ProFolio account. We do not receive your password for those services, we do not see your
            friends, photos, posts or code repositories, and we never post anything on your behalf.
          </p>
        </Section>

        <Section id="use" title="How it is used">
          <List items={[
            'To score your assessments and show your results to you and your professors.',
            'To build your CV and, only if you switch it on, your public showcase page.',
            'Assessment answers and CV content are sent to an AI service (Google Gemini) to be marked or drafted. They are sent without your password or login details.',
          ]} />
          <p>We do not sell your data, and we do not use it for advertising.</p>
        </Section>

        <Section id="who" title="Who can see it">
          <List items={[
            'You can see everything in your own account.',
            'Professors can see your assessment results, integrity events and portfolio, so they can review and grade them.',
            'Administrators can see account details in order to manage access.',
            'Nobody else — unless you turn on your showcase link, which shows only what you chose to include on your CV. Your phone number is never shown publicly.',
          ]} />
        </Section>

        <Section id="delete" title="Deleting your data">
          <p>
            To have your account and everything linked to it deleted — profile, portfolio, assessment
            results, integrity events and messages — contact <Contact /> from the email address on your
            account, and say that you want your ProFolio data deleted. It will be removed within 30 days,
            and you will get a reply once it is done.
          </p>
          <p>
            If you signed in with Facebook, you can also remove ProFolio from your Facebook account under
            Settings &amp; privacy → Settings → Apps and websites. That stops ProFolio receiving anything
            further from Facebook; to delete what ProFolio already stores, send the request above.
          </p>
        </Section>

        <Section id="contact" title="Questions">
          <p>For any question about this page or your data, contact <Contact />.</p>
        </Section>
      </main>
    </div>
  )
}