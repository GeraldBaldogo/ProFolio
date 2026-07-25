import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight, faChevronRight, faChevronDown,
  faBars, faTimes, faRobot, faCode, faKeyboard,
  faDiagramProject, faUserTie, faMedal,
  faGraduationCap, faChartLine, faCircleCheck, faPlay,
  faQuoteLeft, faFire, faListCheck,
  faFingerprint, faFolderOpen, faFileLines, faLightbulb,
  faComments, faCircle, faTerminal, faBug, faDatabase,
  faEye,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import ProFolioLogo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

/* ─────────────────────────────────────────────────────────────────────────────
   PHOTOS
   All image URLs live here so they're easy to swap. Replace any of these with
   real Tomas Claudio Colleges photos later — just drop the file in /assets,
   import it, and point the key at the import. Nothing else needs to change.
   ───────────────────────────────────────────────────────────────────────────── */
const PHOTOS = {
  campus:       'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
  lecture:      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
  studyGroup:   'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80',
  typing:       'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1200&q=80',
  coding:       'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
  debugging:    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80',
  data:         'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&q=80',
  whiteboard:   'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&q=80',
  presenting:   'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
  workspace:    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
  team:         'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
  graduation:   'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  review:       'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80',
  laptopHands:  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
}

// ─── Photo with graceful fallback ─────────────────────────────────────────────
// If an image ever fails to load, the card keeps its shape instead of
// collapsing into a broken-image icon.
const Photo = ({ src, alt = '', className = '', imgClassName = '', overlay = 'from-[#0a0d10] via-[#0a0d10]/35 to-transparent', children }) => {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {failed ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#141d29] via-[#0d1218] to-[#0a0d10]" />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover ${imgClassName}`}
        />
      )}
      <div className={`absolute inset-0 bg-gradient-to-t ${overlay}`} />
      {children}
    </div>
  )
}

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
      I&apos;d start by breaking the task into...
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
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // ── Real, verifiable facts only — no scores/grades ──
  const factStats = [
    { end: 6, label: 'Core assessments', icon: faFire, color: 'text-blue-400', photo: PHOTOS.workspace },
    { end: 4, label: 'Faculty panelists', icon: faUserTie, color: 'text-sky-400', photo: PHOTOS.review },
    { end: 9, label: 'Panel recommendations guiding the build', icon: faLightbulb, color: 'text-violet-400', photo: PHOTOS.whiteboard },
    { end: 3, label: 'Degree programs supported', icon: faGraduationCap, color: 'text-emerald-400', photo: PHOTOS.graduation },
  ]

  const assessments = [
    {
      icon: faKeyboard,
      title: 'Speed Typing',
      desc: 'Measure words-per-minute and accuracy — a baseline skill every tech professional is expected to have.',
      accent: 'blue',
      tag: 'Foundational',
      photo: PHOTOS.typing,
      Mock: TypingMock,
    },
    {
      icon: faCode,
      title: 'Programming Challenge',
      desc: 'A real coding problem generated for your chosen language, taken under copy-paste and tab-switch monitoring.',
      accent: 'violet',
      tag: 'Core Skill',
      photo: PHOTOS.coding,
      Mock: CodeMock,
    },
    {
      icon: faBug,
      title: 'Bug Fix Assessment',
      desc: 'Given a broken snippet, find and correct the defect under time pressure — tests debugging instinct, not just writing new code.',
      accent: 'rose',
      tag: 'Debugging',
      photo: PHOTOS.debugging,
      Mock: BugFixMock,
    },
    {
      icon: faDatabase,
      title: 'SQL Assessment',
      desc: 'Write queries against a sample schema — tests whether you can retrieve and shape data correctly, not just recall syntax.',
      accent: 'sky',
      tag: 'Data Skill',
      photo: PHOTOS.data,
      Mock: SqlMock,
    },
    {
      icon: faDiagramProject,
      title: 'Flowchart Design',
      desc: 'Draw a process flowchart, submit a photo, and get it evaluated for logical structure and clarity.',
      accent: 'emerald',
      tag: 'Logic & Design',
      photo: PHOTOS.whiteboard,
      Mock: FlowchartMock,
    },
    {
      icon: faComments,
      title: 'Communication Assessment',
      desc: 'Respond to a prompt and get evaluated on clarity, structure, and how well you explain a technical idea in plain language.',
      accent: 'fuchsia',
      tag: 'Soft Skill',
      photo: PHOTOS.presenting,
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
    { n:'01', title:'Create account',   desc:'Sign up with your Tomas Claudio Colleges email.',        icon: faGraduationCap, color:'from-blue-400 to-blue-600',    photo: PHOTOS.studyGroup },
    { n:'02', title:'Take assessments', desc:'Complete the six assessments at your own pace.',         icon: faFire,          color:'from-violet-500 to-purple-600', photo: PHOTOS.laptopHands },
    { n:'03', title:'Get AI scored',    desc:'Each submission is evaluated against a fixed rubric.',   icon: faRobot,         color:'from-rose-500 to-pink-500',     photo: PHOTOS.coding },
    { n:'04', title:'Human review',     desc:'Faculty and industry evaluators confirm the verdict.',   icon: faUserTie,       color:'from-amber-500 to-orange-500',  photo: PHOTOS.review },
    { n:'05', title:'Build your profile', desc:'Results feed into a portfolio and CV you can share.',  icon: faMedal,         color:'from-emerald-500 to-teal-600',  photo: PHOTOS.graduation },
  ]

  // ── Roadmap grid, mapped directly to the panel's written recommendations ──
  const panelFeatures = [
    { icon: faListCheck,    title: 'Standardized scoring rubric',        desc: 'Every submission is graded against the same fixed, documented criteria — so a score means the same thing no matter who takes the assessment or when.', status: 'Live' },
    { icon: faFingerprint,  title: 'Originality & anti-cheat checks',    desc: 'Copy-paste blocking and tab-switch monitoring during the coding challenge, so a result reflects the student\u2019s own work.', status: 'Live' },
    { icon: faFolderOpen,   title: 'Built-in portfolio storage',         desc: 'Projects, certificates, and past assessment results stay organized in one place a student can point an employer to.', status: 'Live' },
    { icon: faFileLines,    title: 'Auto-generated CV',                  desc: 'A shareable profile that compiles typing speed, programming proficiency, and other verified results into one document.', status: 'Live' },
    { icon: faLightbulb,    title: 'Personalized growth recommendations', desc: 'Suggested courses, training modules, and certifications targeted at the specific skill gaps an assessment uncovers.', status: 'Roadmap' },
    { icon: faComments,     title: 'Conversational AI assistant',        desc: 'A chat- or voice-based guide to make taking assessments and reading feedback more interactive.', status: 'Roadmap' },
  ]

  // ── Paraphrased, non-verbatim excerpts of the panel's written comments ──
  const panelHighlights = [
    'Keep the evaluation criteria consistent and standardized across every assessment, tied to clear learning outcomes.',
    'Verify that submitted work reflects the student\u2019s own effort rather than being entirely AI-generated.',
    'Expand testing beyond typing and coding to cover communication, problem-solving, creativity, and documentation.',
  ]

  // ── Photo strip: what the platform is actually for ──
  const strip = [
    { src: PHOTOS.lecture,     caption: 'Classroom to career' },
    { src: PHOTOS.typing,      caption: 'Timed typing runs' },
    { src: PHOTOS.coding,      caption: 'Monitored coding challenge' },
    { src: PHOTOS.whiteboard,  caption: 'Flowchart design' },
    { src: PHOTOS.presenting,  caption: 'Explaining your work' },
    { src: PHOTOS.team,        caption: 'Faculty review panel' },
    { src: PHOTOS.graduation,  caption: 'Portfolio you can share' },
  ]

  const faqs = [
    { q: 'Is ProFolio free?', a: 'Yes. ProFolio is free for all students — sign up with your personal email to start.' },
    { q: 'How does the AI assessment work?', a: 'Each submission is scored against a fixed rubric by an AI model, giving instant feedback and a score out of 100.' },
    { q: 'What is the anti-cheat system?', a: 'During the programming challenge, copy-paste is disabled and tab switching is monitored. Violations deduct points from the final score.' },
    { q: 'Can I retake assessments?', a: 'Yes. You can retake any assessment, and your latest score is the one used in your career readiness report.' },
    { q: 'Who reviews my results after the assessments?', a: 'Faculty and industry evaluators from Tomas Claudio Colleges serve as human reviewers who confirm the final readiness verdict.' },
  ]

  const socialLinks = [
    { href:'https://www.instagram.com/gerald.baldogo/', icon:faInstagram, label:'Instagram' },
    { href:'https://www.facebook.com/gerald.baldogo/', icon:faFacebook, label:'Facebook' },
    { href:'https://github.com/GeraldBaldogo', icon:faGithub, label:'GitHub' },
    { href:'https://www.linkedin.com/in/gerald-baldogo-06741440a/', icon:faLinkedin, label:'LinkedIn' },
  ]

  const navLinks = [['#assessments','Assessments'],['#how-it-works','How it works'],['#roadmap','Features'],['#faq','FAQ']]

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
        .glow-blue { box-shadow: 0 0 40px rgba(96,165,250,0.15); }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px); }

        /* keyboard focus stays visible everywhere */
        a:focus-visible, button:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 3px;
          border-radius: 12px;
        }

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
        /* ── Photo strip ── */
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 46s linear infinite; }
        .marquee-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
          .reveal, .reveal-left, .reveal-right { opacity: 1; transform: none; }
        }
      `}</style>

      {/* ── Ambient background ── */}
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
            <img src={ProFolioLogo} alt="ProFolio" className="h-8 w-auto" />
            <span className="text-xl font-black text-white tracking-tight">Pro<span className="accent-text">Folio</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(([href,label]) => (
              <a key={href} href={href} className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all">{label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all">Sign in</button>
            <button onClick={() => navigate('/register')}
              className="bg-blue-400 hover:bg-blue-300 text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              Get started free <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <button aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0a0d10]/98 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-2">
            {navLinks.map(([href,label]) => (
              <a key={href} href={href} className="text-gray-400 text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 hover:text-white" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
              <button onClick={() => navigate('/login')} className="text-gray-400 text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 text-left">Sign in</button>
              <button onClick={() => navigate('/register')} className="bg-blue-400 text-black text-sm font-bold py-3 rounded-xl">
                Get started free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center px-6 pt-28 pb-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-6"
                style={{ animation:'badgeGlow 3s ease-in-out infinite' }}>
                <FontAwesomeIcon icon={faGraduationCap} /> Built for Tomas Claudio Colleges
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.02] mb-6 tracking-tight">
                Prove your<br />
                <span className="accent-text">skills.</span><br />
                Launch your<br />career.
              </h1>

              <p className="text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
                ProFolio is a skills assessment and career readiness platform for BSIT, BSCS, and BSIS students. Take six real challenges, get scored against a fixed rubric, and walk away with a portfolio you can actually show.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <ShimmerButton onClick={() => navigate('/register')}
                  className="group bg-blue-400 hover:bg-blue-300 text-black font-bold px-8 py-4 rounded-2xl text-base transition-colors">
                  Start free assessment <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                </ShimmerButton>
                <button onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base">
                  Sign in <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>

              <div className="flex flex-wrap gap-6">
                {['Rubric-based scoring','Anti-cheat monitored','Human-reviewed'].map((b,i) => (
                  <span key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400" />{b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — photo collage + live product panel */}
            <div className="relative" style={{ animation:'float 6s ease-in-out infinite' }}>
              <div className="relative w-full max-w-lg mx-auto aspect-square">

                {/* Big photo behind everything */}
                <Photo
                  src={PHOTOS.laptopHands}
                  alt="Student working on a coding assessment"
                  className="absolute inset-0 rounded-[2rem] border border-white/10 glow-blue"
                  overlay="from-[#0a0d10] via-[#0a0d10]/55 to-[#0a0d10]/10"
                />

                {/* Product panel floating on the photo */}
                <div className="absolute left-4 right-4 bottom-6 rounded-2xl overflow-hidden border border-white/10 bg-[#0d1218]/95 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center gap-1.5 px-5 pt-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="text-gray-600 text-[11px] font-mono ml-2">profolio — assessment.session</span>
                  </div>
                  <div className="p-5 pt-4 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                      <FontAwesomeIcon icon={faTerminal} className="text-blue-400" /> initializing rubric...
                    </div>
                    {[
                      { w:'w-3/5', c:'bg-blue-400/60' },
                      { w:'w-4/5', c:'bg-gray-700' },
                      { w:'w-2/5', c:'bg-violet-400/50' },
                      { w:'w-1/2', c:'bg-emerald-400/50' },
                    ].map((l,i)=>(
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-700 text-[10px] font-mono w-3">{i+1}</span>
                        <div className={`h-2.5 rounded ${l.w} ${l.c}`} />
                      </div>
                    ))}
                    <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-gray-600 text-[11px] font-mono">status</span>
                      <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCircle} className="text-[6px]" /> monitoring active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Small photo card, top-left */}
                <Photo
                  src={PHOTOS.studyGroup}
                  alt="Students studying together"
                  className="hidden sm:block absolute -top-6 -left-6 w-36 h-28 rounded-2xl border border-white/10 shadow-xl"
                  overlay="from-[#0a0d10]/70 to-transparent"
                >
                  <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-white/90">BSIT · BSCS · BSIS</span>
                </Photo>

                {/* Fact card, top-right */}
                <div className="absolute -top-4 -right-4 bg-[#0d1218]/95 backdrop-blur border border-blue-500/30 rounded-2xl p-4 w-44 sm:w-48 glow-blue">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-400 rounded-lg flex items-center justify-center" style={{ animation:'iconFloat 3.4s ease-in-out infinite' }}>
                      <FontAwesomeIcon icon={faFire} className="text-black text-xs" />
                    </div>
                    <span className="text-white text-xs font-bold">Core assessments</span>
                  </div>
                  <div className="text-3xl font-black text-blue-400 mb-1 font-mono">6</div>
                  <div className="text-xs text-gray-500">Typing · Coding · Bug fix · SQL · Flowchart · Communication</div>
                </div>

                {/* Small photo card, bottom-right */}
                <Photo
                  src={PHOTOS.review}
                  alt="Faculty reviewing student results"
                  className="hidden sm:block absolute -bottom-8 -right-6 w-40 h-28 rounded-2xl border border-white/10 shadow-xl"
                  overlay="from-[#0a0d10]/75 to-transparent"
                >
                  <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-white/90">Human-reviewed results</span>
                </Photo>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo strip ── */}
      <section className="relative z-10 py-10 border-y border-white/5">
        <p className="text-center text-gray-600 text-xs font-mono uppercase tracking-[0.2em] mb-6">
          What a ProFolio run looks like
        </p>
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track flex gap-4 w-max">
            {[...strip, ...strip].map((s,i) => (
              <Photo
                key={i}
                src={s.src}
                alt={s.caption}
                className="w-56 h-32 rounded-2xl border border-white/8 flex-shrink-0"
                imgClassName="grayscale-[0.4] hover:grayscale-0 transition-all duration-500"
                overlay="from-[#0a0d10]/80 via-[#0a0d10]/10 to-transparent"
              >
                <span className="absolute bottom-3 left-4 text-xs font-semibold text-white/90">{s.caption}</span>
              </Photo>
            ))}
          </div>
        </div>
      </section>

      {/* ── Assessments ── */}
      <section id="assessments" className="py-24 px-6 relative z-10 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-5"
              style={{ animation:'badgeGlow 3s ease-in-out infinite' }}>
              <FontAwesomeIcon icon={faFire} /> 6 core assessments
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Real challenges.<br /><span className="accent-text">Rubric-graded.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Each assessment measures one specific skill. Hover any card to see the actual screen you&apos;ll be working in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((a,i) => {
              const ac = accentMap[a.accent]
              const Mock = a.Mock
              return (
                <div key={i} className={`group reveal card-hover border ${ac.border} ${ac.bg} rounded-3xl overflow-hidden`}
                  style={{ transitionDelay:`${(i%3)*120}ms` }}>
                  <div className="relative h-48">
                    <Photo
                      src={a.photo}
                      alt={a.title}
                      className="absolute inset-0"
                      imgClassName="transition-transform duration-700 group-hover:scale-105"
                      overlay="from-[#0d1218] via-[#0d1218]/35 to-transparent"
                    />
                    {/* the real UI, revealed on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <Mock />
                    </div>
                    <div className={`absolute top-4 left-4 w-10 h-10 bg-gradient-to-br ${ac.grad} rounded-xl flex items-center justify-center shadow-lg z-10`}>
                      <FontAwesomeIcon icon={a.icon} className={ac.text} />
                    </div>
                    <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full border ${ac.border} bg-black/40 backdrop-blur-sm text-white z-10`}>
                      {a.tag}
                    </span>
                    <span className="absolute bottom-3 right-4 flex items-center gap-1.5 text-[10px] font-mono text-white/50 group-hover:opacity-0 transition-opacity z-10">
                      <FontAwesomeIcon icon={faEye} /> hover to preview
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
        </div>
      </section>

      {/* ── TCC section ── */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Photo cluster */}
            <div className="reveal-left grid grid-cols-2 gap-4">
              <Photo src={PHOTOS.campus} alt="Students on campus"
                className="col-span-2 h-56 rounded-3xl border border-white/8"
                overlay="from-[#0a0d10]/85 via-[#0a0d10]/20 to-transparent">
                <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Tomas Claudio Colleges
                </div>
              </Photo>
              <Photo src={PHOTOS.lecture} alt="Lecture hall" className="h-36 rounded-2xl border border-white/8"
                overlay="from-[#0a0d10]/60 to-transparent" />
              <Photo src={PHOTOS.team} alt="Students collaborating" className="h-36 rounded-2xl border border-white/8"
                overlay="from-[#0a0d10]/60 to-transparent" />
            </div>

            <div className="reveal-right">
              <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-5"
                style={{ animation:'badgeGlow 3s ease-in-out infinite 1s' }}>
                <FontAwesomeIcon icon={faGraduationCap} /> For TCC students
              </div>
              <h2 className="text-4xl font-black text-white mb-5 tracking-tight leading-tight">
                Built specifically for <span className="accent-text">TCC students</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                ProFolio is a capstone system built for Tomas Claudio Colleges&apos; BSIT, BSCS, and BSIS programs. Scores are tied to a student&apos;s profile and reviewed by TCC faculty.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['BSIT','Bachelor of Science in Information Technology'],
                  ['BSCS','Bachelor of Science in Computer Science'],
                  ['BSIS','Bachelor of Science in Information Systems'],
                  ['All levels','1st year to graduating students'],
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

      {/* ── Facts ── */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {factStats.map((f,i) => (
            <Photo key={i} src={f.photo} alt=""
              className="reveal h-44 rounded-3xl border border-white/8 card-hover"
              imgClassName="opacity-30 transition-opacity duration-500 hover:opacity-45"
              overlay="from-[#0a0d10] via-[#0a0d10]/85 to-[#0a0d10]/60">
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <FontAwesomeIcon icon={f.icon} className={`${f.color} mb-3 text-lg`} />
                <div className={`text-4xl font-black font-mono ${f.color} mb-1`}>
                  <Counter end={f.end} />
                </div>
                <div className="text-gray-400 text-xs leading-snug">{f.label}</div>
              </div>
            </Photo>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 relative z-10 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-5"
              style={{ animation:'badgeGlow 3s ease-in-out infinite 2s' }}>
              <FontAwesomeIcon icon={faChartLine} /> How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              From sign-up to <span className="accent-text">career-ready</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Five steps, in order — each one unlocks the next.</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-14 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-emerald-500/30" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {steps.map((s,i) => (
                <div key={i} className="reveal flex flex-col items-center text-center" style={{ transitionDelay:`${i*100}ms` }}>
                  <div className="relative mb-4">
                    <Photo src={s.photo} alt="" className="w-28 h-28 rounded-full border border-white/10"
                      imgClassName="opacity-70" overlay="from-[#0a0d10]/70 to-transparent" />
                    <div className={`absolute -bottom-1 -right-1 w-11 h-11 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center shadow-lg z-10`}
                      style={{ animation:`iconFloat 3.6s ease-in-out infinite ${i * 0.3}s` }}>
                      <FontAwesomeIcon icon={s.icon} className="text-white" />
                    </div>
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

      {/* ── Features / roadmap (this is what the #roadmap nav link points to) ── */}
      <section id="roadmap" className="py-24 px-6 relative z-10 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <FontAwesomeIcon icon={faListCheck} /> Features &amp; roadmap
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Shaped by the <span className="accent-text">faculty panel</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every item below traces back to a written recommendation from the defense panel. Four are already running; two are next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {panelFeatures.map((f,i) => (
              <div key={i} className="reveal card-hover border border-white/8 bg-white/[0.03] rounded-3xl p-6"
                style={{ transitionDelay:`${(i%3)*100}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={f.icon} className="text-blue-400" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    f.status === 'Live'
                      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                      : 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                  }`}>{f.status}</span>
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Panel comments, next to a photo */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <Photo src={PHOTOS.whiteboard} alt="Project review session"
              className="reveal-left lg:col-span-2 min-h-[220px] rounded-3xl border border-white/8"
              overlay="from-[#0a0d10]/85 via-[#0a0d10]/25 to-transparent">
              <div className="absolute bottom-5 left-5">
                <div className="text-white font-bold text-sm">Capstone defense panel</div>
                <div className="text-gray-400 text-xs">4 faculty and industry evaluators</div>
              </div>
            </Photo>
            <div className="reveal-right lg:col-span-3 flex flex-col gap-3">
              {panelHighlights.map((h,i) => (
                <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 flex gap-4">
                  <FontAwesomeIcon icon={faQuoteLeft} className="text-blue-400/50 mt-1" />
                  <p className="text-gray-400 text-sm leading-relaxed">{h}</p>
                </div>
              ))}
              <p className="text-gray-600 text-xs pl-1">Paraphrased from the panel&apos;s written comments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 relative z-10 scroll-mt-24">
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
                  aria-expanded={openFaq === i}
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

      {/* ── CTA — now on a photo ── */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <Photo src={PHOTOS.graduation} alt="Graduating students"
            className="reveal rounded-3xl border border-white/10"
            imgClassName="opacity-45"
            overlay="from-[#0a0d10] via-[#0a0d10]/85 to-[#0a0d10]/70">
            <div className="relative z-10 p-12 md:p-20 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Ready to prove<br /><span className="accent-text">your skills?</span>
              </h2>
              <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
                Take all six assessments, get rubric-based feedback, and start building a portfolio you can hand to an employer.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ShimmerButton onClick={() => navigate('/register')}
                  className="group bg-blue-400 hover:bg-blue-300 text-black font-bold px-10 py-4 rounded-2xl text-base w-full sm:w-auto transition-colors">
                  Start free <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                </ShimmerButton>
                <button onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white font-semibold px-10 py-4 rounded-2xl transition-all text-base w-full sm:w-auto">
                  Sign in <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>
            </div>
          </Photo>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {socialLinks.map((s,i) => (
              <a key={i} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all">
                <FontAwesomeIcon icon={s.icon} />
              </a>
            ))}
          </div>
          <p className="text-gray-700 text-xs text-center md:text-right">
            Developed by Team ProFolio · © 2026
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage