import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faKeyboard, faCode, faBug, faDatabase, faDiagramProject, faComments,
  faArrowRight, faCheck, faBars, faTimes, faUserTie, faFileLines,
  faFolderOpen, faChevronDown, faImage, faLock, faEye, faClock,
  faWandMagicSparkles, faClipboard, faWindowRestore, faVideoSlash,
  faXmark, faChartSimple, faGraduationCap, faUsers, faShieldHalved,
  faLightbulb, faFingerprint, faMicrophone, faDownload,
} from '@fortawesome/free-solid-svg-icons'
import ThemePicker from '../../components/ThemePicker'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const PHOTOS = {
  teaching: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
  focus: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
}

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ═══════════════════════════════════════════════════════════════════════════
   REVEAL

   The only animation on the page. A serious product page earns attention with
   what it says, not with things that move — so this is a short fade upward and
   nothing else.
   ═══════════════════════════════════════════════════════════════════════════ */

const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (reducedMotion()) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(node)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'reveal-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */

const Eyebrow = ({ children, className = '' }) => (
  <p className={`text-blue-400 text-[13px] font-semibold tracking-[0.14em] uppercase mb-4 ${className}`}>
    {children}
  </p>
)

const SectionHead = ({ eyebrow, title, children, className = '' }) => (
  <div className={`max-w-2xl ${className}`}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 className="text-white font-bold text-3xl sm:text-[2.6rem] leading-[1.12] tracking-[-0.02em] mb-5">
      {title}
    </h2>
    {children && <p className="text-gray-400 text-[17px] leading-[1.7]">{children}</p>}
  </div>
)

const Photo = ({ src, alt = '', seed, className = '', overlay = 'from-black/70 via-black/25 to-transparent', children }) => {
  const [stage, setStage] = useState(0)
  const backup = `https://picsum.photos/seed/${encodeURIComponent(seed || alt || 'profolio')}/1200/900`
  const failed = stage > 1

  return (
    <div className={`photo-surface relative overflow-hidden ${className}`}>
      {failed ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#141d29] to-[#0a0d10] flex items-center justify-center">
          <FontAwesomeIcon icon={faImage} className="text-white/15 text-2xl" />
        </div>
      ) : (
        <img
          key={stage}
          src={stage === 0 ? src : backup}
          alt={alt}
          loading="lazy"
          onError={() => setStage(v => v + 1)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className={`absolute inset-0 bg-gradient-to-t ${overlay}`} />
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCT MOCKS
   dark-surface keeps these dark in light mode, the way an editor pane stays
   dark inside a light IDE.
   ═══════════════════════════════════════════════════════════════════════════ */

const Window = ({ file, right, children, className = '' }) => (
  <div className={`dark-surface bg-[#0d1218] flex flex-col ${className}`}>
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 flex-shrink-0">
      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
      <span className="text-gray-500 text-[10px] font-mono ml-2">{file}</span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
    {children}
  </div>
)

const StudentEditor = () => (
  <Window
    file="solution.py"
    right={<span className="text-[10px] text-rose-400/70 border border-rose-500/25 px-2 py-0.5 rounded-full">paste disabled</span>}
    className="w-full h-full"
  >
    <div className="flex-1 flex">
      <div className="w-44 border-r border-white/5 p-4 hidden sm:block">
        <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.15em] mb-2">Problem</p>
        <p className="text-white text-[11px] font-semibold mb-1.5">Merge overlapping intervals</p>
        <p className="text-gray-500 text-[10px] leading-relaxed mb-4">
          Given a list of intervals, merge any that overlap and return the result sorted.
        </p>
        <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.15em] mb-1.5">It should pass</p>
        <div className="bg-white/[0.04] rounded-lg p-2 font-mono">
          <p className="text-gray-500 text-[9px]">in: <span className="text-cyan-300">[[1,3],[2,6]]</span></p>
          <p className="text-gray-500 text-[9px]">out: <span className="text-emerald-300">[[1,6]]</span></p>
        </div>
      </div>

      <div className="flex-1 p-4 font-mono text-[11px] leading-6 min-w-0">
        <p className="text-gray-600">def <span className="text-blue-400">merge_intervals</span>(intervals):</p>
        <p className="text-gray-600 pl-4">intervals.sort(key=<span className="text-amber-400">lambda</span> x: x[0])</p>
        <p className="text-gray-600 pl-4">merged = []</p>
        <p className="text-gray-600 pl-4"><span className="text-amber-400">for</span> start, end <span className="text-amber-400">in</span> intervals:</p>
        <p className="text-gray-600 pl-8"><span className="text-amber-400">if</span> merged <span className="text-amber-400">and</span> start &lt;= merged[-1][1]:</p>
        <p className="text-gray-500 pl-12">merged[-1][1] = max(merged[-1][1], end)</p>
        <p className="text-gray-600 pl-8"><span className="text-amber-400">else</span>:</p>
        <p className="text-gray-500 pl-12">merged.append([start, end])</p>
        <p className="text-gray-300 pl-4"><span className="text-amber-400">return</span> merged
          <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />
        </p>
      </div>
    </div>

    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 flex-shrink-0">
      <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
        <FontAwesomeIcon icon={faEye} /> face detected
      </span>
      <span className="flex items-center gap-1.5 text-gray-500 text-[10px]">
        <FontAwesomeIcon icon={faClock} /> 08:41 remaining
      </span>
      <span className="ml-auto text-gray-600 text-[10px] font-mono">0 flags</span>
    </div>
  </Window>
)

const ProfessorResults = () => (
  <Window file="results — Merge intervals" className="w-full h-full">
    <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
      <div className="grid grid-cols-4 gap-2">
        {[
          ['Assigned', '24', 'text-white'],
          ['Submitted', '21', 'text-emerald-400'],
          ['Average', '74', 'text-blue-400'],
          ['Flagged', '3', 'text-rose-400'],
        ].map(([label, value, colour], i) => (
          <div key={i} className="bg-white/[0.04] rounded-xl p-2.5">
            <p className={`font-bold text-lg ${colour}`}>{value}</p>
            <p className="text-gray-500 text-[9px]">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {[
          ['Ana Reyes', '88', 'text-emerald-400', 0, false],
          ['Miguel Cruz', '71', 'text-blue-400', 2, false],
          ['Jaime Lim', '54', 'text-amber-400', 0, true],
          ['Sofia Tan', '—', 'text-gray-600', 0, false],
        ].map(([name, score, colour, flags, unproctored], i) => (
          <div key={i} className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {name.charAt(0)}
            </div>
            <p className="text-gray-300 text-[10px] flex-1 truncate">{name}</p>
            {flags > 0 && (
              <span className="flex items-center gap-1 text-rose-400 text-[9px]">
                <FontAwesomeIcon icon={faShieldHalved} /> {flags}
              </span>
            )}
            {unproctored && <FontAwesomeIcon icon={faVideoSlash} className="text-amber-400 text-[9px]" />}
            <span className={`font-bold text-xs ${colour} w-6 text-right`}>{score}</span>
          </div>
        ))}
      </div>
    </div>
  </Window>
)

const CvDocument = ({ className = '' }) => (
  <div className={`dark-surface bg-[#0d1218] p-6 flex flex-col ${className}`}>
    <div className="border-b border-white/10 pb-3 mb-4">
      <p className="text-white font-bold text-lg tracking-tight">Maria Santos</p>
      <p className="text-blue-400 text-[11px] font-semibold">Aspiring Backend Developer</p>
      <p className="text-gray-600 text-[9px] mt-1">maria@email.com · Manila · github.com/msantos</p>
    </div>

    <p className="text-gray-500 text-[8px] font-bold uppercase tracking-[0.18em] mb-1.5">About me</p>
    <p className="text-gray-400 text-[10px] leading-relaxed mb-4">
      A final-year computer science student oriented toward backend systems and data
      modelling, who works through unfamiliar problems methodically rather than quickly.
    </p>

    <p className="text-gray-500 text-[8px] font-bold uppercase tracking-[0.18em] mb-0.5">
      Demonstrated under supervision
    </p>
    <p className="text-gray-600 text-[8px] mb-2">Observed during timed, monitored assessments</p>
    <div className="flex flex-col gap-1.5 mb-4">
      {[
        'Writing correct SQL against an unfamiliar schema',
        'Isolating defects in code she did not write',
        'Explaining technical decisions in plain language',
      ].map((t, i) => (
        <p key={i} className="flex items-start gap-2 text-gray-300 text-[10px] leading-snug">
          <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
          {t}
        </p>
      ))}
    </div>

    <p className="text-gray-500 text-[8px] font-bold uppercase tracking-[0.18em] mb-2">Projects</p>
    <div className="flex flex-col gap-1 mb-4">
      {[['Inventory System', 'PHP · MySQL'], ['Campus Event App', 'React · Firebase']].map(([n, s], i) => (
        <p key={i} className="flex items-start gap-2 text-[10px] leading-snug">
          <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
          <span><span className="text-white font-semibold">{n}</span> <span className="text-gray-500">— {s}</span></span>
        </p>
      ))}
    </div>

    <p className="text-gray-600 text-[8px] mt-auto pt-3 border-t border-white/5">
      No scores printed. What she did, not what she scored.
    </p>
  </div>
)

/* ═══════════════════════════════════════════════════════════════════════════
   ASSESSMENT PREVIEWS
   ═══════════════════════════════════════════════════════════════════════════ */

const TypingPreview = () => (
  <Window file="passage.txt" right={<span className="text-[10px] text-blue-400 font-mono">62 wpm</span>} className="w-full h-full">
    <div className="flex-1 p-4 font-mono text-[11px] leading-7">
      <p>
        <span className="text-gray-500">Asymptotic analysis describes the </span>
        <span className="text-white">limiting behavior of </span>
        <span className="text-rose-400 underline decoration-rose-500">algoritms</span>
        <span className="text-gray-600"> in terms of input size n.</span>
        <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />
      </p>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 text-[10px]">
      <span className="text-gray-500">Accuracy <span className="text-white font-mono">94%</span></span>
      <span className="text-gray-500">Left <span className="text-white font-mono">0:47</span></span>
    </div>
  </Window>
)

const BugPreview = () => (
  <Window file="buggy_code.js" right={<span className="text-[10px] text-rose-400 font-mono">3 defects</span>} className="w-full h-full">
    <div className="flex-1 p-4 font-mono text-[11px] leading-6">
      <p className="text-gray-600">function <span className="text-blue-400">average</span>(nums) {'{'}</p>
      <p className="text-gray-600 pl-4">let sum = 0;</p>
      <p className="bg-rose-500/10 border-l-2 border-rose-500 pl-3 -ml-1 text-gray-400">
        for (let i = 0; i <span className="text-rose-400">&lt;=</span> nums.length; i++)
      </p>
      <p className="text-gray-600 pl-8">sum += nums[i];</p>
      <p className="bg-rose-500/10 border-l-2 border-rose-500 pl-3 -ml-1 text-gray-400">
        return sum <span className="text-rose-400">*</span> nums.length;
      </p>
      <p className="text-gray-600">{'}'}</p>
    </div>
  </Window>
)

const SqlPreview = () => (
  <Window file="query.sql" right={<span className="text-[10px] text-emerald-400 font-mono">schema given</span>} className="w-full h-full">
    <div className="flex-1 p-4 font-mono text-[11px] leading-6">
      <p className="text-gray-600">-- students(id, name, year)</p>
      <p className="text-gray-600">-- scores(student_id, subject, mark)</p>
      <p className="mt-2"><span className="text-amber-400">SELECT</span> <span className="text-gray-400">s.name,</span> <span className="text-blue-400">AVG</span><span className="text-gray-400">(c.mark)</span></p>
      <p><span className="text-amber-400">FROM</span> <span className="text-gray-400">students s</span></p>
      <p><span className="text-amber-400">JOIN</span> <span className="text-gray-400">scores c </span><span className="text-amber-400">ON</span><span className="text-gray-400"> c.student_id = s.id</span></p>
      <p><span className="text-amber-400">GROUP BY</span> <span className="text-gray-400">s.name</span></p>
      <p className="text-gray-300"><span className="text-amber-400">HAVING</span> <span className="text-blue-400">AVG</span>(c.mark) &gt; 80
        <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />
      </p>
    </div>
  </Window>
)

const FlowPreview = () => (
  <Window file="flowchart.jpg" right={<span className="text-[10px] text-amber-400 font-mono">uploaded</span>} className="w-full h-full">
    <div className="flex-1 flex items-center justify-center p-4">
      <svg viewBox="0 0 140 150" className="w-20 h-full" fill="none">
        <rect x="40" y="4" width="60" height="18" rx="9" stroke="#fbbf24" strokeWidth="1.5" />
        <text x="70" y="16" textAnchor="middle" fill="#fbbf24" fontSize="8">start</text>
        <line x1="70" y1="22" x2="70" y2="38" stroke="#4b5563" strokeWidth="1.5" />
        <rect x="35" y="38" width="70" height="18" rx="3" stroke="#6b7280" strokeWidth="1.5" />
        <text x="70" y="50" textAnchor="middle" fill="#9ca3af" fontSize="7">read input</text>
        <line x1="70" y1="56" x2="70" y2="70" stroke="#4b5563" strokeWidth="1.5" />
        <path d="M70 70 L102 88 L70 106 L38 88 Z" stroke="#60a5fa" strokeWidth="1.5" />
        <text x="70" y="91" textAnchor="middle" fill="#60a5fa" fontSize="7">valid?</text>
        <line x1="70" y1="106" x2="70" y2="122" stroke="#4b5563" strokeWidth="1.5" />
        <rect x="40" y="122" width="60" height="18" rx="9" stroke="#34d399" strokeWidth="1.5" />
        <text x="70" y="134" textAnchor="middle" fill="#34d399" fontSize="8">end</text>
      </svg>
    </div>
  </Window>
)

const CommsPreview = () => (
  <Window file="response.txt" right={<span className="text-[10px] text-cyan-400 font-mono">188 words</span>} className="w-full h-full">
    <div className="flex-1 p-4 text-[11px] leading-6">
      <p className="text-gray-600 text-[10px] mb-2 pb-2 border-b border-white/5">
        Explain to a client why their site is slow.
      </p>
      <p className="text-gray-400">
        Thank you for letting us know. A site can load slowly for a few reasons —
        large images, a server under strain, or too much running at once.
      </p>
      <p className="text-gray-400 mt-2">
        We will check which applies here and
        <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-0.5 align-middle animate-pulse" />
      </p>
    </div>
  </Window>
)

const CodeMini = () => (
  <Window file="solution.py" className="w-full h-full">
    <div className="flex-1 p-4 font-mono text-[11px] leading-6">
      <p className="text-gray-600">def <span className="text-blue-400">solve</span>(nums):</p>
      <p className="text-gray-600 pl-4">nums.sort()</p>
      <p className="text-gray-600 pl-4"><span className="text-amber-400">return</span> nums[0]
        <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />
      </p>
    </div>
  </Window>
)

const ASSESSMENTS = [
  { key: 'typing', icon: faKeyboard, label: 'Typing speed', accent: 'text-blue-400', bg: 'from-blue-500 to-cyan-500',
    blurb: 'A passage your professor chose, against a clock they set. Words per minute and accuracy, with mistakes marked as they happen.',
    Preview: TypingPreview },
  { key: 'programming', icon: faCode, label: 'Programming', accent: 'text-violet-400', bg: 'from-violet-500 to-purple-600',
    blurb: 'A problem statement, starter code and test cases written by your lecturer. You solve it in the language they chose.',
    Preview: CodeMini },
  { key: 'bugfix', icon: faBug, label: 'Bug fixing', accent: 'text-rose-400', bg: 'from-rose-500 to-pink-600',
    blurb: 'Broken code you did not write, with defects planted deliberately. Find them, fix them, keep the behaviour intact.',
    Preview: BugPreview },
  { key: 'sql', icon: faDatabase, label: 'SQL queries', accent: 'text-emerald-400', bg: 'from-emerald-500 to-teal-600',
    blurb: 'A schema you have never seen and a question to answer. Joins, aggregates, whatever the question needs.',
    Preview: SqlPreview },
  { key: 'flowchart', icon: faDiagramProject, label: 'Flowcharts', accent: 'text-amber-400', bg: 'from-amber-500 to-orange-500',
    blurb: 'Draw the process on paper, photograph it, upload it. Marked against criteria your professor wrote.',
    Preview: FlowPreview },
  { key: 'communication', icon: faComments, label: 'Communication', accent: 'text-cyan-400', bg: 'from-cyan-500 to-blue-600',
    blurb: 'Explain something technical to somebody who is not. Judged on clarity, structure and plain language.',
    Preview: CommsPreview },
]

const FAQ = [
  {
    q: 'Who decides what the assessments contain?',
    a: 'Your professor. They write the problem, the starter code, the marking criteria and the deadline. The AI scores the answer against what they set — it does not invent the test.',
  },
  {
    q: 'Does practice count towards the CV?',
    a: 'No. Any assessment can be practised as often as you like, and none of it reaches the CV. Only work a professor set and timed counts as evidence — an attempt that can be repeated until it looks good proves very little.',
  },
  {
    q: 'What if a laptop has no camera?',
    a: 'The assessment still runs. Tab switching and pasting are still monitored, and the attempt is marked as unproctored so the professor knows. Nobody is locked out of an exam over hardware.',
  },
  {
    q: 'Can an assigned assessment be retaken?',
    a: 'No. Once submitted, that is the answer — the same as any other exam. Practice runs are unlimited, which is where retaking belongs.',
  },
  {
    q: 'What happens at the deadline?',
    a: 'An assessment that has not been opened closes. One already in progress can be finished and submitted — losing work because a clock ticked over mid-attempt would be the system\u2019s fault, not the student\u2019s.',
  },
  {
    q: 'How is the AI kept honest?',
    a: 'It is given the professor\u2019s rubric and marks against that. Its score and its written feedback are both shown to the professor next to the student\u2019s answer, labelled as a suggestion. The professor has the final word.',
  },
  {
    q: 'Who owns the data?',
    a: 'Students keep their portfolio and every CV they generate. Professors see only the students they assigned work to. Nothing is shared between institutions.',
  },
  {
    q: 'Which programmes can use this?',
    a: 'Any computer science or IT programme. Nothing in the system is tied to one school — a professor registers, is approved by an administrator, and writes assessments for their own class.',
  },
]

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [activeAssessment, setActiveAssessment] = useState('programming')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const current = ASSESSMENTS.find(a => a.key === activeAssessment) || ASSESSMENTS[1]
  const CurrentPreview = current.Preview

  const NAV_LINKS = [
    ['Product', '#product'],
    ['Assessments', '#assessments'],
    ['Integrity', '#integrity'],
    ['For faculty', '#faculty'],
    ['FAQ', '#faq'],
  ]

  return (
    <div className="min-h-screen bg-[#060612] font-sans overflow-x-hidden">

      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal-in { opacity: 1; transform: translateY(0); }

        /* The wordmark picks up whichever accent is selected, so the gradient
           follows the theme rather than being hard-coded blue. */
        .brand-gradient {
          background: linear-gradient(100deg, var(--accent-300), var(--accent-500));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        .ambient {
          position: absolute;
          border-radius: 9999px;
          filter: blur(110px);
          pointer-events: none;
          z-index: 0;
        }
        .ambient-a {
          width: 620px; height: 620px;
          top: -160px; left: -140px;
          background: rgba(var(--accent-rgb), 0.16);
        }
        .ambient-b {
          width: 520px; height: 520px;
          bottom: -180px; right: -120px;
          background: rgba(var(--accent-rgb), 0.11);
        }
        .ambient-c {
          width: 560px; height: 560px;
          top: 40px; right: -220px;
          background: rgba(var(--accent-rgb), 0.09);
        }
        .ambient-d {
          width: 640px; height: 640px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(var(--accent-rgb), 0.12);
        }

        /* On white these read as smudges rather than light, so they drop to a
           tint you only notice if you look for it. */
        [data-theme="light"] .ambient-a { background: rgba(var(--accent-rgb), 0.10); }
        [data-theme="light"] .ambient-b { background: rgba(var(--accent-rgb), 0.07); }
        [data-theme="light"] .ambient-c { background: rgba(var(--accent-rgb), 0.06); }
        [data-theme="light"] .ambient-d { background: rgba(var(--accent-rgb), 0.08); }

        a:focus-visible, button:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 3px;
          border-radius: 10px;
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1 !important; transform: none !important; }
          *, *::before, *::after {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ══ Nav ══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-[#060612]/85 backdrop-blur-xl border-b border-white/5' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-[62px] flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logo} alt="" className="w-7 h-7 object-contain" />
            <span className="text-[17px] font-bold text-white tracking-tight">
              Pro<span className="text-blue-400">Folio</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 ml-9">
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href}
                className="text-gray-400 hover:text-white text-[14px] transition-colors">
                {label}
              </a>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block mr-1"><ThemePicker /></div>
            <Link to="/login"
              className="text-gray-400 hover:text-white text-[14px] font-medium px-3 py-2 transition-colors">
              Sign in
            </Link>
            <Link to="/register"
              className="bg-blue-500 hover:bg-blue-600 text-white text-[14px] font-semibold px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-[#0a0a18] border-b border-white/5 px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="text-gray-400 hover:text-white text-sm py-1">
                {label}
              </a>
            ))}
            <div className="pt-2"><ThemePicker /></div>
          </div>
        )}
      </nav>

      {/* ══ Hero ══ */}
      {/* min-h-screen so the first thing anyone sees is the sentence, not a
          screenshot cut in half by the fold. */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">

        {/* Ambient wash. Two soft pools of the accent colour behind the text,
            which is where the page gets its depth from now that nothing moves. */}
        <div aria-hidden="true" className="ambient ambient-a" />
        <div aria-hidden="true" className="ambient ambient-b" />

        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <h1 className="text-white font-bold text-[2.3rem] sm:text-[3.4rem] lg:text-[3.9rem] leading-[1.06] tracking-[-0.03em] mb-7">
              <span className="brand-gradient">ProFolio</span> turns the work
              <br className="hidden sm:block" />
              {' '}your professor sets into a CV
              <br className="hidden sm:block" />
              {' '}an employer can trust
            </h1>
          </Reveal>

          <Reveal delay={80}>
            <p className="text-gray-400 text-[18px] sm:text-[19px] leading-[1.65] max-w-2xl mx-auto mb-9">
              Lecturers write the assessments themselves. Students sit them under
              supervision. What they were observed doing becomes a one-page CV — written
              as evidence rather than a scorecard.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <Link to="/register"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-[15px] px-6 py-3 rounded-xl transition-colors">
                Get started <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
              <a href="#product"
                className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white font-semibold text-[15px] px-6 py-3 rounded-xl transition-all">
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <p className="text-gray-600 text-[13px]">
              Free for students · Faculty accounts approved by an administrator
            </p>
          </Reveal>
        </div>

        {/* Outside the centred block, so it anchors to the section rather than
            landing on top of the buttons. */}
        <a href="#product"
          aria-label="Scroll to see how it works"
          className="absolute bottom-7 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1.5 text-gray-600 hover:text-gray-400 transition-colors">
          <span className="text-[10px] tracking-[0.16em] uppercase">See it working</span>
          <FontAwesomeIcon icon={faChevronDown} className="text-[10px] animate-bounce" />
        </a>
      </section>

      {/* The product itself, on its own. A serious page shows the thing rather
          than describing it — but it earns its own space rather than crowding
          the sentence above it. */}
      <section className="px-6 pb-8">
        <Reveal className="max-w-5xl mx-auto">
          <div className="border border-white/8 rounded-2xl overflow-hidden shadow-2xl aspect-[16/10]">
            <StudentEditor />
          </div>
        </Reveal>
      </section>

      {/* ══ Premise ══ */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="text-white text-[26px] sm:text-[32px] font-semibold leading-[1.35] tracking-[-0.02em] mb-6">
              A transcript records that a subject was passed.
              It does not record <span className="brand-gradient">whether the code can be written</span>.
            </p>
            <p className="text-gray-400 text-[17px] leading-[1.7]">
              Graduates list frameworks they touched once. Employers cannot tell the
              difference until the interview, and students cannot prove the difference
              before it. ProFolio closes that gap with work a lecturer set and watched.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══ Product: three alternating rows ══ */}
      <section id="product" className="px-6 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto">

          <Reveal className="mb-20">
            <SectionHead eyebrow="The product" title={<>Three parts, <span className="brand-gradient">one line of evidence</span></>}>
              Each part is thin on its own. Together they turn a semester of coursework
              into something a hiring manager can read in ten seconds.
            </SectionHead>
          </Reveal>

          <div className="flex flex-col gap-24">

            {/* 01 */}
            <Reveal>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-gray-600 font-mono text-sm">01</span>
                  <h3 className="text-white font-bold text-[26px] tracking-[-0.02em] mt-2 mb-4">
                    Faculty author the assessment
                  </h3>
                  <p className="text-gray-400 text-[16px] leading-[1.7] mb-6">
                    A lecturer chooses one of six types and writes the content themselves —
                    the problem statement, the starter code, the database schema, the marking
                    criteria, the time limit. It is their exam, delivered by software.
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      'Six assessment types, all faculty-authored',
                      'Draft privately, publish when ready',
                      'Assign to selected students with a deadline',
                    ].map((t, i) => (
                      <span key={i} className="flex items-start gap-3 text-gray-400 text-[15px]">
                        <FontAwesomeIcon icon={faCheck} className="text-blue-400 text-xs mt-1.5 flex-shrink-0" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border border-white/8 rounded-2xl overflow-hidden shadow-xl aspect-[4/3] order-first lg:order-last">
                  <Window file="new test — programming" className="w-full h-full">
                    <div className="flex-1 p-5 flex flex-col gap-3">
                      {[
                        ['Title', 'Merge overlapping intervals'],
                        ['Language', 'Python'],
                      ].map(([label, value], i) => (
                        <div key={i}>
                          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.15em] mb-1">{label}</p>
                          <div className="bg-white/[0.04] rounded-lg px-3 py-2">
                            <p className="text-gray-300 text-[11px]">{value}</p>
                          </div>
                        </div>
                      ))}
                      <div>
                        <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.15em] mb-1">Problem statement</p>
                        <div className="bg-white/[0.04] rounded-lg px-3 py-2">
                          <p className="text-gray-400 text-[10px] leading-relaxed">
                            Given a list of intervals, merge any that overlap and return the
                            result sorted by start time.
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.15em] mb-1">Test cases</p>
                        <div className="bg-white/[0.04] rounded-lg px-3 py-2 font-mono">
                          <p className="text-gray-500 text-[10px]">in <span className="text-cyan-300">[[1,3],[2,6]]</span> → out <span className="text-emerald-300">[[1,6]]</span></p>
                        </div>
                      </div>
                    </div>
                  </Window>
                </div>
              </div>
            </Reveal>

            {/* 02 */}
            <Reveal>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="border border-white/8 rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                  <ProfessorResults />
                </div>

                <div>
                  <span className="text-gray-600 font-mono text-sm">02</span>
                  <h3 className="text-white font-bold text-[26px] tracking-[-0.02em] mt-2 mb-4">
                    Students sit it under supervision
                  </h3>
                  <p className="text-gray-400 text-[16px] leading-[1.7] mb-6">
                    Camera proctoring, tab-switch detection and paste blocking run for the
                    length of the attempt. The AI marks the answer against the lecturer&apos;s
                    rubric within seconds, and the lecturer sees every submission, every
                    score and every flag on one screen.
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      'Marked in seconds, with written feedback',
                      'Flags shown beside the answer that earned them',
                      'One view per student, across every assessment set',
                    ].map((t, i) => (
                      <span key={i} className="flex items-start gap-3 text-gray-400 text-[15px]">
                        <FontAwesomeIcon icon={faCheck} className="text-blue-400 text-xs mt-1.5 flex-shrink-0" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* 03 */}
            <Reveal>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-gray-600 font-mono text-sm">03</span>
                  <h3 className="text-white font-bold text-[26px] tracking-[-0.02em] mt-2 mb-4">
                    The results become a CV
                  </h3>
                  <p className="text-gray-400 text-[16px] leading-[1.7] mb-6">
                    One page, generated from two halves: what the student was observed doing,
                    and the portfolio they built themselves. Written as prose rather than a
                    scorecard, and regenerated whenever new work is completed.
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      'Written from assessed evidence and portfolio content',
                      'No marks printed anywhere on the document',
                      'Exports to PDF, kept after graduation',
                    ].map((t, i) => (
                      <span key={i} className="flex items-start gap-3 text-gray-400 text-[15px]">
                        <FontAwesomeIcon icon={faCheck} className="text-blue-400 text-xs mt-1.5 flex-shrink-0" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border border-white/8 rounded-2xl overflow-hidden shadow-xl order-first lg:order-last">
                  <CvDocument className="aspect-[4/3]" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ Assessments ══ */}
      <section id="assessments" className="px-6 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <SectionHead eyebrow="Assessment types" title={<>Six ways to <span className="brand-gradient">demonstrate competence</span></>}>
              Every type carries the lecturer&apos;s own content. Students may practise any of
              them freely; only assigned attempts count as evidence.
            </SectionHead>
          </Reveal>

          <Reveal delay={60}>
            <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">

              <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {ASSESSMENTS.map((a) => {
                  const active = a.key === activeAssessment
                  return (
                    <button
                      key={a.key}
                      onClick={() => setActiveAssessment(a.key)}
                      aria-pressed={active}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all flex-shrink-0 lg:w-full ${
                        active
                          ? 'border-white/15 bg-white/[0.06]'
                          : 'border-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={a.icon}
                        className={`text-sm flex-shrink-0 transition-colors ${active ? a.accent : 'text-gray-600'}`}
                      />
                      <span className={`font-medium text-[14px] whitespace-nowrap ${active ? 'text-white' : 'text-gray-400'}`}>
                        {a.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="border border-white/8 bg-white/[0.02] rounded-2xl overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-7 flex flex-col justify-center">
                    <div className={`w-10 h-10 bg-gradient-to-br ${current.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <FontAwesomeIcon icon={current.icon} className="text-white text-sm" />
                    </div>
                    <p className="text-white font-bold text-[19px] tracking-[-0.01em] mb-2.5">{current.label}</p>
                    <p className="text-gray-400 text-[15px] leading-[1.7]">{current.blurb}</p>
                  </div>

                  <div className="h-60 md:h-auto md:min-h-[260px] border-t md:border-t-0 md:border-l border-white/8">
                    <CurrentPreview key={current.key} />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Integrity ══ */}
      <section id="integrity" className="relative px-6 py-24 scroll-mt-16 overflow-hidden">
        <div aria-hidden="true" className="ambient ambient-c" />
        <div className="relative max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <SectionHead eyebrow="Academic integrity" title={<>Why the result <span className="brand-gradient">carries weight</span></>}>
              An unsupervised assessment proves nothing — the answer is a search away.
              Three mechanisms run for the duration of every attempt.
            </SectionHead>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {[
              {
                icon: faEye, title: 'Camera proctoring', accent: 'text-emerald-400',
                lines: ['Confirms a face is present', 'Flags a second person in frame', 'Flags sustained looking away'],
              },
              {
                icon: faWindowRestore, title: 'Tab monitoring', accent: 'text-amber-400',
                lines: ['Every switch away is recorded', 'A warning appears on return', 'The count reaches the lecturer'],
              },
              {
                icon: faClipboard, title: 'Paste blocking', accent: 'text-rose-400',
                lines: ['Blocked outright, not merely logged', 'Copying out is blocked too', 'The editor holds only typed input'],
              },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="border border-white/8 bg-white/[0.02] rounded-2xl p-6 h-full">
                  <FontAwesomeIcon icon={c.icon} className={`${c.accent} mb-4`} />
                  <p className="text-white font-semibold text-[16px] mb-3">{c.title}</p>
                  <div className="flex flex-col gap-2">
                    {c.lines.map((l, j) => (
                      <span key={j} className="flex items-start gap-2.5 text-gray-400 text-[14px] leading-[1.6]">
                        <FontAwesomeIcon icon={faCheck} className={`${c.accent} text-[10px] mt-1.5 flex-shrink-0`} />
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Stating the limits is what makes the rest credible. */}
          <Reveal delay={140}>
            <div className="border border-white/8 bg-white/[0.02] rounded-2xl p-7 grid md:grid-cols-3 gap-7">
              {[
                {
                  icon: faVideoSlash, colour: 'text-amber-400',
                  title: 'A missing camera does not block the exam',
                  body: 'Tab and paste monitoring do not require one. The attempt proceeds and is marked as unproctored so the lecturer can weigh it accordingly.',
                },
                {
                  icon: faUserTie, colour: 'text-blue-400',
                  title: 'Flags are evidence, not verdicts',
                  body: 'A flag deducts points and appears beside the answer. It does not fail anyone automatically — the lecturer reads the work and decides.',
                },
                {
                  icon: faFingerprint, colour: 'text-violet-400',
                  title: 'Originality checking on submitted work',
                  body: 'Portfolio content can be checked separately, so written material is held to the same standard as timed work.',
                },
              ].map((c, i) => (
                <div key={i}>
                  <FontAwesomeIcon icon={c.icon} className={`${c.colour} text-sm mb-3`} />
                  <p className="text-white font-semibold text-[15px] mb-2">{c.title}</p>
                  <p className="text-gray-400 text-[14px] leading-[1.65]">{c.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ No scores ══ */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-12">
            <SectionHead eyebrow="Design decision" title={<>The CV carries <span className="brand-gradient">no marks</span></>}>
              Every score is visible inside the application. None of them are printed on the
              document a student sends out. That is deliberate.
            </SectionHead>
          </Reveal>

          <Reveal delay={60}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="border border-white/8 bg-white/[0.02] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 mb-5">
                  <FontAwesomeIcon icon={faXmark} className="text-rose-400 text-sm" />
                  <p className="text-gray-400 font-semibold text-[14px]">A scorecard</p>
                </div>
                <div className="dark-surface bg-[#0d1218] rounded-xl p-4 mb-5 font-mono">
                  <p className="text-gray-500 text-[10px] mb-2">TECHNICAL SKILLS</p>
                  <p className="text-gray-400 text-[11px]">SQL <span className="text-white">76 / 100</span></p>
                  <p className="text-gray-400 text-[11px]">Programming <span className="text-white">68 / 100</span></p>
                  <p className="text-gray-400 text-[11px]">Typing <span className="text-white">82 / 100</span></p>
                </div>
                <p className="text-gray-400 text-[15px] leading-[1.7]">
                  A hiring manager has no way to read 76. Out of what, marked by whom,
                  compared against which cohort? It reads as a grade, and grades belong on
                  a transcript.
                </p>
              </div>

              <div className="border border-white/8 bg-white/[0.02] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 mb-5">
                  <FontAwesomeIcon icon={faCheck} className="text-emerald-400 text-sm" />
                  <p className="text-gray-400 font-semibold text-[14px]">What ProFolio writes instead</p>
                </div>
                <div className="dark-surface bg-[#0d1218] rounded-xl p-4 mb-5">
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.15em] mb-2.5">
                    Demonstrated under supervision
                  </p>
                  {[
                    'Writing correct SQL against an unfamiliar schema',
                    'Isolating defects in code she did not write',
                  ].map((t, i) => (
                    <p key={i} className="flex items-start gap-2 text-gray-300 text-[11px] leading-snug mb-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      {t}
                    </p>
                  ))}
                </div>
                <p className="text-gray-400 text-[15px] leading-[1.7]">
                  A sentence anyone can act on. It states what was done and under what
                  conditions, and it survives being read in ten seconds.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-white/8 bg-white/[0.02] rounded-2xl p-7 flex items-start gap-4">
              <FontAwesomeIcon icon={faChartSimple} className="text-blue-400 text-sm mt-1 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-[15px] mb-2">The numbers still exist</p>
                <p className="text-gray-400 text-[15px] leading-[1.7]">
                  Every score, attempt and flag is available in the student&apos;s results page
                  and the lecturer&apos;s. Progress between attempts is visible to both. The CV
                  is simply not the place for it — it is the one document written for
                  somebody who has never met the student.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Two audiences ══ */}
      <section id="faculty" className="px-6 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <SectionHead eyebrow="Who it is for" title="Built for both sides of the desk" />
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-5">

            <Reveal>
              <div className="border border-white/8 bg-white/[0.02] rounded-2xl overflow-hidden h-full flex flex-col">
                <Photo src={PHOTOS.teaching} alt="" seed="faculty" className="h-44" overlay="from-black/70 to-black/20">
                  <div className="absolute bottom-4 left-6">
                    <FontAwesomeIcon icon={faUserTie} className="text-amber-400 mb-1.5" />
                    <p className="text-white font-bold text-[19px] tracking-[-0.01em]">For faculty</p>
                  </div>
                </Photo>

                <div className="p-7 flex-1 flex flex-col">
                  <p className="text-gray-400 text-[15px] leading-[1.7] mb-6">
                    Write an assessment once, assign it with a deadline, and read the results
                    the same day. The AI proposes a score against your rubric; you keep the
                    final word.
                  </p>
                  <div className="flex flex-col gap-3 mb-7">
                    {[
                      [faWandMagicSparkles, 'Six assessment types, your content in all of them'],
                      [faClock, 'Deadlines that close without cutting off an attempt in progress'],
                      [faLock, 'Proctoring flags beside the answer that earned them'],
                      [faUsers, 'One view per student, across everything you set'],
                    ].map(([icon, text], i) => (
                      <span key={i} className="flex items-start gap-3 text-gray-400 text-[14px] leading-[1.6]">
                        <FontAwesomeIcon icon={icon} className="text-amber-400 text-xs mt-1 flex-shrink-0" /> {text}
                      </span>
                    ))}
                  </div>
                  <Link to="/register"
                    className="mt-auto self-start flex items-center gap-2 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white font-semibold text-[14px] px-5 py-2.5 rounded-xl transition-all">
                    Register as faculty <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="border border-white/8 bg-white/[0.02] rounded-2xl overflow-hidden h-full flex flex-col">
                <Photo src={PHOTOS.focus} alt="" seed="students" className="h-44" overlay="from-black/70 to-black/20">
                  <div className="absolute bottom-4 left-6">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400 mb-1.5" />
                    <p className="text-white font-bold text-[19px] tracking-[-0.01em]">For students</p>
                  </div>
                </Photo>

                <div className="p-7 flex-1 flex flex-col">
                  <p className="text-gray-400 text-[15px] leading-[1.7] mb-6">
                    Practise as often as you like, sit the assessments your lecturers set,
                    and leave with a document that describes what you can do rather than
                    what you studied.
                  </p>
                  <div className="flex flex-col gap-3 mb-7">
                    {[
                      [faFolderOpen, 'A portfolio for projects, skills and certifications'],
                      [faFileLines, 'A one-page CV, regenerated as you complete more'],
                      [faLightbulb, 'Recommendations for what to learn next'],
                      [faMicrophone, 'An assistant that answers in plain language'],
                    ].map(([icon, text], i) => (
                      <span key={i} className="flex items-start gap-3 text-gray-400 text-[14px] leading-[1.6]">
                        <FontAwesomeIcon icon={icon} className="text-blue-400 text-xs mt-1 flex-shrink-0" /> {text}
                      </span>
                    ))}
                  </div>
                  <Link to="/register"
                    className="mt-auto self-start flex items-center gap-2 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white font-semibold text-[14px] px-5 py-2.5 rounded-xl transition-all">
                    Create a student account <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ Everything else ══ */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-12">
            <SectionHead eyebrow="Also included" title="The rest of the system">
              Everything below ships with the platform rather than sitting behind a tier.
            </SectionHead>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              [faFolderOpen, 'Portfolio builder', 'Projects, skills, certifications, achievements and work experience, all feeding the CV.'],
              [faFingerprint, 'Originality checking', 'Submitted written work can be checked before it becomes part of a portfolio.'],
              [faLightbulb, 'Recommendations', 'Suggested courses and certifications aimed at the gaps the assessments exposed.'],
              [faMicrophone, 'Conversational assistant', 'Answers questions about the platform, with speech input and optional spoken replies.'],
              [faComments, 'Messaging', 'Direct conversation between a student and the lecturer who set their work.'],
              [faDownload, 'PDF export', 'The CV prints to a single page, with in-app notes and growth areas left off.'],
            ].map(([icon, title, body], i) => (
              <Reveal key={i} delay={(i % 3) * 60}>
                <div className="border border-white/8 bg-white/[0.02] rounded-2xl p-6 h-full">
                  <FontAwesomeIcon icon={icon} className="text-blue-400 text-sm mb-4" />
                  <p className="text-white font-semibold text-[16px] mb-2">{title}</p>
                  <p className="text-gray-400 text-[14px] leading-[1.65]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="px-6 py-24 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <Reveal className="mb-10">
            <SectionHead eyebrow="Questions" title="Frequently asked" />
          </Reveal>

          <div className="border-t border-white/8">
            {FAQ.map((f, i) => {
              const open = openFaq === i
              return (
                <Reveal key={i} delay={i * 30}>
                  <div className="border-b border-white/8">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="w-full flex items-center gap-5 py-5 text-left"
                    >
                      <span className="text-white font-medium text-[16px] flex-1">{f.q}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-gray-500 text-xs flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {open && (
                      <p className="pb-6 pr-10 text-gray-400 text-[15px] leading-[1.75]">{f.a}</p>
                    )}
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ Close ══ */}
      <section className="relative px-6 py-28 overflow-hidden">
        <div aria-hidden="true" className="ambient ambient-d" />
        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-white font-bold text-[2.2rem] sm:text-[2.8rem] leading-[1.1] tracking-[-0.03em] mb-5">
              <span className="brand-gradient">Evidence</span>, not description
            </h2>
            <p className="text-gray-400 text-[18px] leading-[1.65] mb-9 max-w-xl mx-auto">
              Set the work, run it properly, and let the results speak for themselves.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/register"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-colors">
                Get started <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
              <Link to="/login"
                className="border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all">
                Sign in
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Footer ══ */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img src={logo} alt="" className="w-7 h-7 object-contain" />
                <span className="text-white font-bold tracking-tight">
                  Pro<span className="text-blue-400">Folio</span>
                </span>
              </div>
              <p className="text-gray-500 text-[13px] leading-[1.65]">
                Skills assessment and portfolio building for computer science programmes.
              </p>
            </div>

            {[
              ['Product', [['Overview', '#product'], ['Assessments', '#assessments'], ['Integrity', '#integrity']]],
              ['Audience', [['For faculty', '#faculty'], ['For students', '#faculty'], ['FAQ', '#faq']]],
            ].map(([heading, links], i) => (
              <div key={i}>
                <p className="text-white font-semibold text-[13px] mb-3">{heading}</p>
                <div className="flex flex-col gap-2">
                  {links.map(([label, href]) => (
                    <a key={label} href={href} className="text-gray-500 hover:text-white text-[13px] transition-colors">
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p className="text-white font-semibold text-[13px] mb-3">Account</p>
              <div className="flex flex-col gap-2">
                <Link to="/login" className="text-gray-500 hover:text-white text-[13px] transition-colors">Sign in</Link>
                <Link to="/register" className="text-gray-500 hover:text-white text-[13px] transition-colors">Register</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-wrap items-center gap-3">
            <p className="text-gray-600 text-[12px]">All rights reserved.</p>
            <p className="ml-auto text-gray-600 text-[12px]">
              &copy; {new Date().getFullYear()} Developed by ProFolio Team
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}