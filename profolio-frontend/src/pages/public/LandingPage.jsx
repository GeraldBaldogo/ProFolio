import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight, faChevronRight, faChevronDown,
  faBars, faTimes, faRobot, faCode, faKeyboard,
  faDiagramProject, faTrophy, faUserTie, faMedal,
  faGraduationCap, faChartLine, faCircleCheck, faPlay,
  faQuoteLeft, faFire, faListCheck,
  faFingerprint, faFolderOpen, faFileLines, faLightbulb,
  faComments, faCircle, faTerminal, faBug, faDatabase,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import ProFolioLogo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// Only one real photo left in the whole page — genuine campus/student life for
// institutional context. Everything assessment-related is a built UI mockup below,
// so it actually represents what ProFolio does instead of generic stock photography.
const STUDENTS_PHOTO = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80'

// ─── Animated Counter (integers only) ────────────────────────────────────────
const Counter = ({ end, suffix = '', duration = 1400 }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const step = end / (duration / 16)
        const timer = setInterval(() => {
          start += step
          if (start >= end) { setCount(end); clearInterval(timer) }
          else setCount(Math.floor(start))
        }, 16)
        observer.disconnect()
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

// ─── Mock UI: typing test ─────────────────────────────────────────────────────
const TypingMock = () => (
  <div className="w-full h-full bg-[#0d1218] p-5 flex flex-col justify-center gap-3">
    <div className="flex items-center gap-2 mb-1">
      <FontAwesomeIcon icon={faKeyboard} className="text-blue-400 text-xs" />
      <span className="text-gray-500 text-[10px] font-mono uppercase tracking-wide">typing-test.run</span>
    </div>
    <p className="font-mono text-sm leading-relaxed">
      <span className="text-gray-600">the quick brown fox </span>
      <span className="text-blue-400">jumps over</span>
      <span className="inline-block w-[2px] h-4 bg-blue-400 ml-0.5 align-middle animate-pulse" />
      <span className="text-gray-700"> the lazy dog</span>
    </p>
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
      <div className="h-full w-[46%] bg-blue-400 rounded-full" />
    </div>
  </div>
)

// ─── Mock UI: code editor ─────────────────────────────────────────────────────
const CodeMock = () => (
  <div className="w-full h-full bg-[#0d1218] p-5 flex flex-col gap-2 justify-center">
    <div className="flex items-center gap-1.5 mb-2">
      <span className="w-2 h-2 rounded-full bg-white/15" />
      <span className="w-2 h-2 rounded-full bg-white/15" />
      <span className="w-2 h-2 rounded-full bg-white/15" />
      <span className="text-gray-600 text-[10px] font-mono ml-2">solution.py</span>
    </div>
    {[
      { w: 'w-2/5', c: 'bg-violet-400/70' },
      { w: 'w-4/5', c: 'bg-gray-600' },
      { w: 'w-3/5', c: 'bg-violet-400/40' },
      { w: 'w-1/2', c: 'bg-gray-700' },
      { w: 'w-2/3', c: 'bg-violet-400/70' },
    ].map((l,i) => (
      <div key={i} className="flex items-center gap-2">
        <span className="text-gray-700 text-[10px] font-mono w-3">{i+1}</span>
        <div className={`h-2 rounded ${l.w} ${l.c}`} />
      </div>
    ))}
    <div className="text-[10px] font-mono text-gray-600 mt-2">$ monitoring: tab-switch · copy-paste</div>
  </div>
)

// ─── Mock UI: bug fix diff ─────────────────────────────────────────────────────
const BugFixMock = () => (
  <div className="w-full h-full bg-[#0d1218] p-5 flex flex-col justify-center gap-3">
    <div className="flex items-center gap-2 mb-1">
      <FontAwesomeIcon icon={faBug} className="text-rose-400 text-xs" />
      <span className="text-gray-500 text-[10px] font-mono uppercase tracking-wide">bugfix.diff</span>
    </div>
    <div className="font-mono text-[11px] flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-rose-400/80 bg-rose-500/5 px-2 py-1 rounded">
        <span>-</span><span className="line-through decoration-rose-500/60">return total / count</span>
      </div>
      <div className="flex items-center gap-2 text-emerald-400/90 bg-emerald-500/5 px-2 py-1 rounded">
        <span>+</span><span>return total / max(count, 1)</span>
      </div>
    </div>
    <div className="text-[10px] font-mono text-gray-600 mt-1">$ 1 defect found · awaiting fix</div>
  </div>
)

// ─── Mock UI: SQL query ────────────────────────────────────────────────────────
const SqlMock = () => (
  <div className="w-full h-full bg-[#0d1218] p-5 flex flex-col justify-center gap-3">
    <div className="flex items-center gap-2 mb-1">
      <FontAwesomeIcon icon={faDatabase} className="text-sky-400 text-xs" />
      <span className="text-gray-500 text-[10px] font-mono uppercase tracking-wide">query.sql</span>
    </div>
    <p className="font-mono text-xs leading-relaxed">
      <span className="text-sky-400">SELECT</span><span className="text-gray-500"> name, score </span>
      <span className="text-sky-400">FROM</span><span className="text-gray-500"> students</span>
    </p>
    <div className="grid grid-cols-2 gap-1.5 mt-1">
      {[0,1,2].map(i => (
        <div key={i} className="contents">
          <div className="h-2 rounded bg-gray-700" />
          <div className="h-2 rounded bg-sky-400/30" />
        </div>
      ))}
    </div>
  </div>
)

// ─── Mock UI: flowchart ────────────────────────────────────────────────────────
const FlowchartMock = () => (
  <div className="w-full h-full bg-[#0d1218] p-5 flex flex-col items-center justify-center gap-2">
    <div className="px-4 py-1.5 rounded-full border border-emerald-400/40 text-emerald-300 text-[11px] font-mono">Start</div>
    <div className="w-px h-3 bg-white/15" />
    <div className="w-16 h-16 border border-emerald-400/40 rotate-45 flex items-center justify-center">
      <span className="-rotate-45 text-emerald-300 text-[9px] font-mono text-center leading-tight">valid?</span>
    </div>
    <div className="w-px h-3 bg-white/15" />
    <div className="flex items-center gap-6">
      <div className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-400 text-[10px] font-mono">retry</div>
      <div className="px-3 py-1.5 rounded-lg border border-emerald-400/40 text-emerald-300 text-[10px] font-mono">End</div>
    </div>
  </div>
)

// ─── Mock UI: communication ─────────────────────────────────────────────────────
const CommunicationMock = () => (
  <div className="w-full h-full bg-[#0d1218] p-5 flex flex-col justify-center gap-2">
    <div className="flex items-center gap-2 mb-1">
      <FontAwesomeIcon icon={faComments} className="text-fuchsia-400 text-xs" />
      <span className="text-gray-500 text-[10px] font-mono uppercase tracking-wide">response.log</span>
    </div>
    <div className="self-start max-w-[85%] bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-3 py-2 text-[11px] text-gray-400">
      Explain your approach to this problem.
    </div>
    <div className="self-end max-w-[85%] bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl rounded-br-sm px-3 py-2 text-[11px] text-fuchsia-200">
      I'd start by breaking the task into...
      <span className="inline-block w-[2px] h-3 bg-fuchsia-300 ml-0.5 align-middle animate-pulse" />
    </div>
  </div>
)

// ─── Shimmering CTA button — used only for the two highest-priority CTAs ──────
const ShimmerButton = ({ onClick, className, children }) => (
  <button onClick={onClick} className={`relative overflow-hidden group ${className}`}>
    <span
      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
      style={{ animation: 'shimmer 3.2s ease-in-out infinite' }}
    />
    <span className="relative z-10 flex items-center justify-center gap-2 w-full">{children}</span>
  </button>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // ── Real, verifiable facts only — no scores/grades ──
  const factStats = [
    { end: 6, suffix: '', label: 'Core Assessments', icon: faFire, color: 'text-blue-400' },
    { end: 4, suffix: '', label: 'Faculty Panelists', icon: faUserTie, color: 'text-sky-400' },
    { end: 9, suffix: '', label: 'Panel Recommendations Guiding the Build', icon: faLightbulb, color: 'text-violet-400' },
    { end: 3, suffix: '', label: 'Degree Programs Supported', icon: faGraduationCap, color: 'text-emerald-400' },
  ]

  const assessments = [
    {
      icon: faKeyboard,
      title: 'Speed Typing',
      desc: 'Measure words-per-minute and accuracy — a baseline skill every tech professional is expected to have.',
      accent: 'blue',
      tag: 'Foundational',
      Mock: TypingMock,
    },
    {
      icon: faCode,
      title: 'Programming Challenge',
      desc: 'A real coding problem generated for your chosen language, taken under copy-paste and tab-switch monitoring.',
      accent: 'violet',
      tag: 'Core Skill',
      Mock: CodeMock,
    },
    {
      icon: faBug,
      title: 'Bug Fix Assessment',
      desc: 'Given a broken snippet, find and correct the defect under time pressure — tests debugging instinct, not just writing new code.',
      accent: 'rose',
      tag: 'Debugging',
      Mock: BugFixMock,
    },
    {
      icon: faDatabase,
      title: 'SQL Assessment',
      desc: 'Write queries against a sample schema — tests whether you can retrieve and shape data correctly, not just recall syntax.',
      accent: 'sky',
      tag: 'Data Skill',
      Mock: SqlMock,
    },
    {
      icon: faDiagramProject,
      title: 'Flowchart Design',
      desc: 'Draw a process flowchart, submit a photo, and get it evaluated for logical structure and clarity.',
      accent: 'emerald',
      tag: 'Logic & Design',
      Mock: FlowchartMock,
    },
    {
      icon: faComments,
      title: 'Communication Assessment',
      desc: 'Respond to a prompt and get evaluated on clarity, structure, and how well you explain a technical idea in plain language.',
      accent: 'fuchsia',
      tag: 'Soft Skill',
      Mock: CommunicationMock,
    },
  ]

  const accentMap = {
    blue:     { border: 'border-blue-500/30',     bg: 'bg-blue-500/10',     grad: 'from-blue-400 to-blue-600',       text: 'text-black' },
    violet:   { border: 'border-violet-500/30',   bg: 'bg-violet-500/10',   grad: 'from-violet-500 to-purple-600',    text: 'text-white' },
    rose:     { border: 'border-rose-500/30',     bg: 'bg-rose-500/10',     grad: 'from-rose-500 to-red-600',         text: 'text-white' },
    sky:      { border: 'border-sky-500/30',      bg: 'bg-sky-500/10',      grad: 'from-sky-500 to-blue-600',         text: 'text-white' },
    emerald:  { border: 'border-emerald-500/30',  bg: 'bg-emerald-500/10',  grad: 'from-emerald-500 to-teal-600',     text: 'text-white' },
    fuchsia:  { border: 'border-fuchsia-500/30',  bg: 'bg-fuchsia-500/10',  grad: 'from-fuchsia-500 to-pink-600',     text: 'text-white' },
  }

  const steps = [
    { n:'01', title:'Create Account', desc:'Sign up with your Tomas Claudio Colleges email.', icon: faGraduationCap, color:'from-blue-400 to-blue-600' },
    { n:'02', title:'Take Assessments', desc:'Complete the six assessments at your own pace.', icon: faFire, color:'from-violet-500 to-purple-600' },
    { n:'03', title:'Get AI Scored', desc:'Each submission is evaluated against a fixed rubric.', icon: faRobot, color:'from-rose-500 to-pink-500' },
    { n:'04', title:'Human Review', desc:'Faculty and industry evaluators confirm the final verdict.', icon: faUserTie, color:'from-amber-500 to-orange-500' },
    { n:'05', title:'Build Your Profile', desc:'Results feed into a portfolio and CV you can share.', icon: faMedal, color:'from-emerald-500 to-teal-600' },
  ]

  // ── Roadmap grid, mapped directly to the panel's written recommendations ──
  const panelFeatures = [
    { icon: faListCheck, title: 'Standardized Scoring Rubric', desc: 'Every submission is graded against the same fixed, documented criteria — so a score means the same thing no matter who takes the assessment or when.', status: 'Live' },
    { icon: faFingerprint, title: 'Originality & Anti-Cheat Checks', desc: 'Copy-paste blocking and tab-switch monitoring during the coding challenge, so a result reflects the student\u2019s own work.', status: 'Live' },
    { icon: faFolderOpen, title: 'Built-In Portfolio Storage', desc: 'Projects, certificates, and past assessment results stay organized in one place a student can point an employer to.', status: 'Live' },
    { icon: faFileLines, title: 'Auto-Generated CV', desc: 'A shareable profile that compiles typing speed, programming proficiency, and other verified results into one document.', status: 'Live' },
    { icon: faLightbulb, title: 'Personalized Growth Recommendations', desc: 'Suggested courses, training modules, and certifications targeted at the specific skill gaps an assessment uncovers.', status: 'Roadmap' },
    { icon: faComments, title: 'Conversational AI Assistant', desc: 'A chat- or voice-based guide to make taking assessments and reading feedback more interactive.', status: 'Roadmap' },
  ]

  // ── Paraphrased, non-verbatim excerpts of the panel's written comments ──
  const panelHighlights = [
    'Keep the evaluation criteria consistent and standardized across every assessment, tied to clear learning outcomes.',
    'Verify that submitted work reflects the student\u2019s own effort rather than being entirely AI-generated.',
    'Expand testing beyond typing and coding to cover communication, problem-solving, creativity, and documentation.',
  ]

  const faqs = [
    { q: 'Is ProFolio free?', a: 'Yes. ProFolio is free for all students — sign up with your personal email to start.' },
    { q: 'How does the AI assessment work?', a: 'Each submission is scored against a fixed rubric by an AI model, giving instant feedback and a score out of 100.' },
    { q: 'What is the anti-cheat system?', a: 'During the programming challenge, copy-paste is disabled and tab switching is monitored. Violations deduct points from the final score.' },
    { q: 'Can I retake assessments?', a: 'Yes. You can retake any assessment, and your latest score is the one used in your career readiness report.' },
    { q: 'Who reviews my results after the assessments?', a: 'Faculty and industry evaluators from Tomas Claudio Colleges serve as human reviewers who confirm the final readiness verdict.' },
  ]

  const socialLinks = [
    { href:'https://www.instagram.com/gerald.baldogo/', icon:faInstagram },
    { href:'https://www.facebook.com/gerald.baldogo/', icon:faFacebook },
    { href:'https://github.com/GeraldBaldogo', icon:faGithub },
    { href:'https://www.linkedin.com/in/gerald-baldogo-06741440a/', icon:faLinkedin },
  ]

  return (
    <div className="min-h-screen bg-[#0a0d10] font-sans overflow-x-hidden">

      <style>{`
        .reveal { opacity:0; transform:translateY(28px); transition:opacity 0.6s ease, transform 0.6s ease; }
        .reveal.in { opacity:1; transform:translateY(0); }
        .reveal-left { opacity:0; transform:translateX(-28px); transition:opacity 0.6s ease, transform 0.6s ease; }
        .reveal-left.in { opacity:1; transform:translateX(0); }
        .reveal-right { opacity:0; transform:translateX(28px); transition:opacity 0.6s ease, transform 0.6s ease; }
        .reveal-right.in { opacity:1; transform:translateX(0); }
        .accent-text { color: #60a5fa; }
        .accent-text-warm { color: #fbbf24; }
        .glow-blue { box-shadow: 0 0 40px rgba(96,165,250,0.15); }
        .glow-amber { box-shadow: 0 0 40px rgba(251,191,36,0.12); }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); }

        /* ── Ambient background motion ── */
        @keyframes drift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(50px, -35px) scale(1.08); }
          66%  { transform: translate(-35px, 25px) scale(0.94); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.02; }
          50%      { opacity: 0.045; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-20%); opacity: 0; }
          8%   { opacity: 0.5; }
          85%  { opacity: 0.5; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

        /* ── Small, deliberate touches on specific elements only ── */
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes badgeGlow {
          0%, 100% { box-shadow: 0 0 0px rgba(96,165,250,0); }
          50%      { box-shadow: 0 0 16px rgba(96,165,250,0.22); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-260%) skewX(-20deg); }
          100% { transform: translateX(360%) skewX(-20deg); }
        }
      `}</style>

      {/* ── Ambient background: three drifting gradient orbs + a scan-line
           sweep, echoing the "monitoring / assessment" theme of the product
           rather than a generic decorative glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full -top-64 -left-32 opacity-[0.07]"
          style={{ background:'radial-gradient(circle, #60a5fa, transparent 70%)', animation:'drift 15s ease-in-out infinite' }} />
        <div className="absolute w-[550px] h-[550px] rounded-full top-1/3 -right-20 opacity-[0.06]"
          style={{ background:'radial-gradient(circle, #a78bfa, transparent 70%)', animation:'drift 19s ease-in-out infinite 3s' }} />
        <div className="absolute w-[460px] h-[460px] rounded-full bottom-[-10%] left-1/4 opacity-[0.05]"
          style={{ background:'radial-gradient(circle, #34d399, transparent 70%)', animation:'drift 17s ease-in-out infinite 6s' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage:'linear-gradient(rgba(148,163,184,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.8) 1px,transparent 1px)', backgroundSize:'48px 48px', animation:'gridPulse 6s ease-in-out infinite' }} />
        <div className="absolute left-0 right-0 h-40"
          style={{ background:'linear-gradient(to bottom, transparent, rgba(96,165,250,0.07), transparent)', animation:'scanline 8s linear infinite', filter:'blur(6px)' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0d10]/90 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={ProFolioLogo} alt="ProFolio Logo" className="h-8 w-auto" />
            <span className="text-xl font-black text-white tracking-tight">Pro<span className="accent-text">Folio</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[['#assessments','Assessments'],['#roadmap','Features'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all">{label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all">Sign In</button>
            <button onClick={() => navigate('/register')}
              className="bg-blue-400 hover:bg-blue-300 text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              Get Started Free <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <button className="md:hidden w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0a0d10]/98 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-2">
            {[['#assessments','Assessments'],['#roadmap','Features'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="text-gray-400 text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 hover:text-white" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
              <button onClick={() => navigate('/login')} className="text-gray-400 text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 text-left">Sign In</button>
              <button onClick={() => navigate('/register')}
                className="bg-blue-400 text-black text-sm font-bold py-3 rounded-xl">
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center px-6 pt-24 pb-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="relative z-10">

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.02] mb-6 tracking-tight">
                Prove Your<br />
                <span className="accent-text">Skills.</span><br />
                Launch Your<br />Career.
              </h1>

              <p className="text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
                ProFolio is a skills assessment and career readiness platform built for BSIT, BSCS, and BSIS students. Take six real challenges, get scored against a fixed rubric, and walk away with a portfolio you can actually show.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <ShimmerButton onClick={() => navigate('/register')}
                  className="group bg-blue-400 hover:bg-blue-300 text-black font-bold px-8 py-4 rounded-2xl text-base transition-colors">
                  Start Free Assessment <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                </ShimmerButton>
                <button onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base">
                  Sign In <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>

              <div className="flex flex-wrap gap-6">
                {['Rubric-Based Scoring','Anti-Cheat Monitored','Human-Reviewed',].map((b,i) => (
                  <span key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400" />{b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — product mockup + real fact cards */}
            <div className="relative hidden lg:block" style={{ animation:'float 6s ease-in-out infinite' }}>
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-4 rounded-3xl overflow-hidden glow-blue border border-white/10 bg-[#0d1218]">
                  <div className="flex items-center gap-1.5 px-5 pt-5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="text-gray-600 text-[11px] font-mono ml-2">profolio — assessment.session</span>
                  </div>
                  <div className="p-5 pt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                      <FontAwesomeIcon icon={faTerminal} className="text-blue-400" /> initializing rubric...
                    </div>
                    {[
                      { w:'w-3/5', c:'bg-blue-400/60' },
                      { w:'w-4/5', c:'bg-gray-700' },
                      { w:'w-2/5', c:'bg-violet-400/50' },
                      { w:'w-3/4', c:'bg-gray-700' },
                      { w:'w-1/2', c:'bg-emerald-400/50' },
                    ].map((l,i)=>(
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-700 text-[10px] font-mono w-3">{i+1}</span>
                        <div className={`h-2.5 rounded ${l.w} ${l.c}`} />
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-gray-600 text-[11px] font-mono">status</span>
                      <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCircle} className="text-[6px]" /> monitoring active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fact card 1 — real */}
                <div className="absolute -top-4 -right-4 bg-[#0d1218] border border-blue-500/30 rounded-2xl p-4 w-48 glow-blue">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-400 rounded-lg flex items-center justify-center" style={{ animation:'iconFloat 3.4s ease-in-out infinite' }}>
                      <FontAwesomeIcon icon={faFire} className="text-black text-xs" />
                    </div>
                    <span className="text-white text-xs font-bold">Core Assessments</span>
                  </div>
                  <div className="text-3xl font-black text-blue-400 mb-1 font-mono">6</div>
                  <div className="text-xs text-gray-500">Typing · Coding · Bug Fix · SQL · Flowchart · Communication</div>
                </div>

                {/* Fact card 2 — real, no grade */}
                <div className="absolute -bottom-4 -left-4 bg-[#0d1218] border border-sky-500/30 rounded-2xl p-4 w-56">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center" style={{ animation:'iconFloat 3.4s ease-in-out infinite 0.6s' }}>
                      <FontAwesomeIcon icon={faGraduationCap} className="text-white text-xs" />
                    </div>
                    <span className="text-white text-xs font-bold">Programs Supported</span>
                  </div>
                  <div className="text-lg font-black text-sky-400 mb-1 font-mono">BSIT · BSCS · BSIS</div>
                </div>

                {/* Fact card 3 — real */}
                <div className="absolute bottom-16 -right-6 bg-[#0d1218] border border-emerald-500/30 rounded-2xl p-3 w-44">
                  <div className="text-gray-500 text-[10px] mb-1">Anti-Cheat Monitoring</div>
                  <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Assessments ── */}
      <section id="assessments" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-5"
              style={{ animation:'badgeGlow 3s ease-in-out infinite' }}>
              <FontAwesomeIcon icon={faFire} /> 6 Core Assessments
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Real challenges.<br /><span className="accent-text">Rubric-graded.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Each assessment measures one specific skill. Complete all six to build your career readiness profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((a,i) => {
              const ac = accentMap[a.accent]
              const Mock = a.Mock
              return (
                <div key={i} className={`reveal card-hover border ${ac.border} ${ac.bg} rounded-3xl overflow-hidden`}
                  style={{ transitionDelay:`${(i%3)*120}ms` }}>
                  <div className="relative h-44 overflow-hidden">
                    <Mock />
                    <div className={`absolute top-4 left-4 w-10 h-10 bg-gradient-to-br ${ac.grad} rounded-xl flex items-center justify-center shadow-lg`}>
                      <FontAwesomeIcon icon={a.icon} className={ac.text} />
                    </div>
                    <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full border ${ac.border} ${ac.bg} text-white`}>
                      {a.tag}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-black text-xl mb-2">{a.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-5">{a.desc}</p>
                    <button onClick={() => navigate('/register')}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold ${ac.text} bg-gradient-to-r ${ac.grad} flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                      <FontAwesomeIcon icon={faPlay} /> Try this assessment
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            {['Typing','Coding','Bug Fix','SQL','Flowchart','Communication','Career Profile'].map((label,i,arr) => (
              <span key={i} className={`text-sm font-semibold px-3 py-1 rounded-full border ${
                i === arr.length - 1 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-gray-400 border-white/10 bg-white/[0.03]'
              }`}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TCC section (keeps one real, authentic photo) ── */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="reveal-left">
              <div className="relative rounded-3xl overflow-hidden h-80">
                <img src={STUDENTS_PHOTO} alt="Students working" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d10]/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    Tomas Claudio Colleges
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal-right">
              <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-5"
                style={{ animation:'badgeGlow 3s ease-in-out infinite 1s' }}>
                <FontAwesomeIcon icon={faGraduationCap} /> For TCC Students
              </div>
              <h2 className="text-4xl font-black text-white mb-5 tracking-tight leading-tight">
                Built specifically for <span className="accent-text">TCC students</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                ProFolio is a capstone system built for Tomas Claudio Colleges' BSIT, BSCS, and BSIS programs. Scores are tied to a student's profile and reviewed by TCC faculty.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['BSIT','Bachelor of Science in Information Technology'],
                  ['BSCS','Bachelor of Science in Computer Science'],
                  ['BSIS','Bachelor of Science in Information Systems'],
                  ['All Levels','1st year to graduating students'],
                ].map(([title,desc],i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-4">
                    <div className="text-white font-bold text-sm mb-1">{title}</div>
                    <div className="text-gray-500 text-xs">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-5"
              style={{ animation:'badgeGlow 3s ease-in-out infinite 2s' }}>
              <FontAwesomeIcon icon={faChartLine} /> How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              From sign-up to <span className="accent-text">career-ready</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Five steps to your career readiness profile.</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-emerald-500/30" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {steps.map((s,i) => (
                <div key={i} className="reveal flex flex-col items-center text-center" style={{ transitionDelay:`${i*100}ms` }}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg relative z-10`}
                    style={{ animation:`iconFloat 3.6s ease-in-out infinite ${i * 0.3}s` }}>
                    <FontAwesomeIcon icon={s.icon} className="text-white text-xl" />
                  </div>
                  <div className="text-xs text-gray-600 font-mono mb-1">{s.n}</div>
                  <h3 className="text-white font-bold text-sm mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Got questions?</h2>
            <p className="text-gray-400">Everything you need to know about ProFolio.</p>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq,i) => (
              <div key={i} className="reveal border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden"
                style={{ transitionDelay:`${i*60}ms` }}>
                <button className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  onClick={() => setOpenFaq(openFaq===i ? null : i)}>
                  <span className="font-semibold text-white text-sm">{faq.q}</span>
                  <FontAwesomeIcon icon={faChevronDown}
                    className={`text-gray-500 text-xs flex-shrink-0 transition-transform duration-300 ${openFaq===i ? 'rotate-180 text-blue-400' : ''}`} />
                </button>
                {openFaq===i && (
                  <div className="px-6 pb-5 border-t border-white/5">
                    <p className="text-gray-400 text-sm leading-relaxed pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="reveal relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-sky-600/10 to-violet-600/10" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="relative z-10 p-12 md:p-20 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Ready to prove<br /><span className="accent-text">your skills?</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Take all six assessments, get rubric-based feedback, and start building a portfolio a faculty panel already put its name behind.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ShimmerButton onClick={() => navigate('/register')}
                  className="group bg-blue-400 hover:bg-blue-300 text-black font-bold px-10 py-4 rounded-2xl text-base w-full sm:w-auto transition-colors">
                  Start Free <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                </ShimmerButton>
                <button onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-2xl transition-all text-base w-full sm:w-auto">
                  Sign In <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer — no logo/wordmark, socials on the left ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {socialLinks.map((s,i) => (
              <a key={i} href={s.href} target="_blank" rel="noreferrer"
                className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all">
                <FontAwesomeIcon icon={s.icon} />
              </a>
            ))}
          </div>
          <p className="text-gray-700 text-xs text-center md:text-right">
            Developed by Team ProFolio · © 2026 ·
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage