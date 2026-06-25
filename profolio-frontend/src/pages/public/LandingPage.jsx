import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight, faChevronRight, faChevronDown,
  faBars, faTimes, faRobot, faCode, faKeyboard,
  faDiagramProject, faTrophy, faStar, faUsers,
  faBolt, faShieldHalved, faGraduationCap, faChartLine,
  faCircleCheck, faCheck, faPlay, faQuoteLeft,
  faUserTie, faMedal, faFire, faLock, faUnlock,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// ─── Unsplash Photos ───────────────────────────────────────────────────────────
const PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80',
  coding: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80',
  typing: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80',
  flowchart: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  students: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
  career: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
  team: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
const Counter = ({ end, suffix = '', duration = 2000 }) => {
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

// ─── Main Component ────────────────────────────────────────────────────────────
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

  const assessments = [
    {
      icon: faKeyboard,
      title: 'Speed Typing',
      desc: 'Measure your words-per-minute and accuracy. A foundational skill for every tech professional.',
      gradient: 'from-cyan-500 to-blue-500',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      tag: 'Foundational',
      img: PHOTOS.typing,
    },
    {
      icon: faCode,
      title: 'Programming Challenge',
      desc: 'AI generates a real coding problem in your chosen language. Anti-cheat monitored, time-limited.',
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      tag: 'Core Skill',
      img: PHOTOS.coding,
    },
    {
      icon: faDiagramProject,
      title: 'Flowchart Design',
      desc: 'Draw a process flowchart, snap a photo, and let AI evaluate your logical thinking.',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      tag: 'Logic & Design',
      img: PHOTOS.flowchart,
    },
  ]

  const steps = [
    { n:'01', title:'Create Account', desc:'Sign up with your Tomas Claudio Colleges email.', icon: faGraduationCap, color:'from-blue-500 to-cyan-500' },
    { n:'02', title:'Take Assessments', desc:'Complete typing, coding, and flowchart challenges.', icon: faFire, color:'from-violet-500 to-purple-600' },
    { n:'03', title:'Get AI Scored', desc:'Claude AI evaluates each submission instantly.', icon: faRobot, color:'from-rose-500 to-pink-500' },
    { n:'04', title:'Human Review', desc:'Expert evaluators give the final career verdict.', icon: faUserTie, color:'from-amber-500 to-orange-500' },
    { n:'05', title:'Earn Your Report', desc:'Get a shareable career readiness certificate.', icon: faMedal, color:'from-emerald-500 to-teal-600' },
  ]

  const stats = [
    { end: 500, suffix: '+', label: 'Students Evaluated', icon: faUsers, color: 'text-blue-400' },
    { end: 95, suffix: '%', label: 'Satisfaction Rate', icon: faStar, color: 'text-amber-400' },
    { end: 3, suffix: ' min', label: 'Avg AI Response', icon: faBolt, color: 'text-violet-400' },
    { end: 100, suffix: '%', label: 'Free to Use', icon: faShieldHalved, color: 'text-emerald-400' },
  ]

  const testimonials = [
    { name:'Maria Santos', course:'BSCS — 4th Year', quote:'The coding challenge was tough but fair. My AI score actually matched what I expected. Great platform!', avatar:'MS', color:'from-blue-500 to-cyan-500', rating: 5 },
    { name:'Juan dela Cruz', course:'BSIT — 3rd Year', quote:'I loved the anti-cheat system — makes the results feel real. My employer was impressed with my verified score.', avatar:'JD', color:'from-violet-500 to-purple-600', rating: 5 },
    { name:'Andrea Reyes', course:'BSCS — Graduating', quote:'The flowchart assessment was unique — I had never seen that in any platform before. Really tests your thinking.', avatar:'AR', color:'from-rose-500 to-pink-600', rating: 5 },
  ]

  const faqs = [
    { q: 'Is ProFolio free for Tomas Claudio students?', a: 'Yes! ProFolio is completely free for all students of Tomas Claudio Colleges. Just sign up and start.' },
    { q: 'How does the AI assessment work?', a: 'Each assessment is submitted to Claude AI which evaluates correctness, quality, and skill level. You get instant feedback with a score out of 100.' },
    { q: 'What is the anti-cheat system?', a: 'During programming challenges, copy-paste is disabled and tab switching is monitored. Each violation deducts points from your final score.' },
    { q: 'Can I retake assessments?', a: 'Yes! You can retake any assessment. Your latest score will be used for your career readiness report.' },
    { q: 'Who reviews my portfolio after the assessments?', a: 'Faculty members and industry professionals from Tomas Claudio Colleges serve as human evaluators who give the final career readiness verdict.' },
  ]

  const socialLinks = [
    { href:'https://www.instagram.com/gerald.baldogo/', icon:faInstagram },
    { href:'https://www.facebook.com/gerald.baldogo/', icon:faFacebook },
    { href:'https://github.com/GeraldBaldogo', icon:faGithub },
    { href:'https://www.linkedin.com/in/gerald-baldogo-06741440a/', icon:faLinkedin },
  ]

  return (
    <div className="min-h-screen bg-[#04040f] font-sans overflow-x-hidden">

      <style>{`
        .reveal { opacity:0; transform:translateY(28px); transition:opacity 0.6s ease, transform 0.6s ease; }
        .reveal.in { opacity:1; transform:translateY(0); }
        .reveal-left { opacity:0; transform:translateX(-28px); transition:opacity 0.6s ease, transform 0.6s ease; }
        .reveal-left.in { opacity:1; transform:translateX(0); }
        .reveal-right { opacity:0; transform:translateX(28px); transition:opacity 0.6s ease, transform 0.6s ease; }
        .reveal-right.in { opacity:1; transform:translateX(0); }
        .gradient-text { background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gradient-text-green { background: linear-gradient(135deg, #34d399, #60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glow-blue { box-shadow: 0 0 40px rgba(96,165,250,0.15); }
        .glow-violet { box-shadow: 0 0 40px rgba(167,139,250,0.15); }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); }
        .noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); }
      `}</style>

      {/* ── Animated background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full -top-64 -left-32 opacity-[0.07]"
          style={{ background:'radial-gradient(circle, #3b82f6, transparent 70%)', animation:'pulse 8s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full top-1/3 -right-20 opacity-[0.07]"
          style={{ background:'radial-gradient(circle, #8b5cf6, transparent 70%)', animation:'pulse 10s ease-in-out infinite 2s' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bottom-1/4 left-1/4 opacity-[0.05]"
          style={{ background:'radial-gradient(circle, #06b6d4, transparent 70%)', animation:'pulse 7s ease-in-out infinite 4s' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage:'linear-gradient(rgba(99,102,241,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.8) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.07} 50%{transform:scale(1.1);opacity:0.12} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#04040f]/90 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ProFolio" className="w-9 h-9 object-contain" />
            <span className="text-xl font-black text-white tracking-tight">Pro<span className="gradient-text">Folio</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[['#assessments','Assessments'],['#how-it-works','How It Works'],['#testimonials','Testimonials'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all">{label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all">Sign In</button>
            <button onClick={() => navigate('/register')}
              className="relative text-white text-sm font-bold px-5 py-2.5 rounded-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 group-hover:opacity-90 transition-opacity" />
              <span className="relative flex items-center gap-2">Get Started Free <FontAwesomeIcon icon={faArrowRight} /></span>
            </button>
          </div>
          <button className="md:hidden w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#04040f]/98 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-2">
            {[['#assessments','Assessments'],['#how-it-works','How It Works'],['#testimonials','Testimonials'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="text-gray-400 text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 hover:text-white" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
              <button onClick={() => navigate('/login')} className="text-gray-400 text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 text-left">Sign In</button>
              <button onClick={() => navigate('/register')}
                className="relative text-white text-sm font-bold py-3 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
                <span className="relative">Get Started Free</span>
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
              <div className="inline-flex items-center gap-2.5 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Tomas Claudio Colleges — Official Platform
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.02] mb-6 tracking-tight">
                Prove Your<br />
                <span className="gradient-text">Skills.</span><br />
                Launch Your<br />Career.
              </h1>

              <p className="text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
                ProFolio is the all-in-one skills assessment and career readiness platform for BSIT, BSCS, and BSIS students. Take real challenges. Get AI-scored. Get certified.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button onClick={() => navigate('/register')}
                  className="group relative text-white font-bold px-8 py-4 rounded-2xl overflow-hidden text-base">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 transition-all group-hover:opacity-90" />
                  <span className="relative flex items-center justify-center gap-2">
                    Start Free Assessment <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                <button onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base">
                  Sign In <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>

              <div className="flex flex-wrap gap-6">
                {['AI-Powered Scoring','Anti-Cheat Monitored','Expert Evaluation','Free for Students'].map((b,i) => (
                  <span key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400" />{b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — photo collage */}
            <div className="relative hidden lg:block" style={{ animation:'float 6s ease-in-out infinite' }}>
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Main photo */}
                <div className="absolute inset-4 rounded-3xl overflow-hidden glow-blue">
                  <img src={PHOTOS.hero} alt="Students collaborating" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04040f]/80 via-transparent to-transparent" />
                </div>

                {/* Floating card 1 */}
                <div className="absolute -top-4 -right-4 bg-[#0d0d1f] border border-violet-500/30 rounded-2xl p-4 w-48 glow-violet">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs" />
                    </div>
                    <span className="text-white text-xs font-bold">AI Score</span>
                  </div>
                  <div className="text-3xl font-black text-violet-400 mb-1">87<span className="text-sm text-gray-500">/100</span></div>
                  <div className="text-xs text-gray-500">Programming Challenge</div>
                </div>

                {/* Floating card 2 */}
                <div className="absolute -bottom-4 -left-4 bg-[#0d0d1f] border border-emerald-500/30 rounded-2xl p-4 w-52 glow-blue">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faTrophy} className="text-white text-xs" />
                    </div>
                    <span className="text-white text-xs font-bold">Career Readiness</span>
                  </div>
                  <div className="text-sm font-black text-emerald-400 mb-1">Developing ✓</div>
                  <div className="text-xs text-gray-500">Official Verdict · May 2026</div>
                </div>

                {/* Floating card 3 */}
                <div className="absolute bottom-16 -right-6 bg-[#0d0d1f] border border-blue-500/30 rounded-2xl p-3 w-40">
                  <div className="text-gray-500 text-[10px] mb-1">Typing Speed</div>
                  <div className="text-2xl font-black text-blue-400">74 <span className="text-xs text-gray-500">WPM</span></div>
                  <div className="text-[10px] text-emerald-400">96% accuracy ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s,i) => (
              <div key={i} className="reveal card-hover border border-white/8 bg-white/[0.03] rounded-2xl p-6 text-center"
                style={{ transitionDelay:`${i*80}ms` }}>
                <FontAwesomeIcon icon={s.icon} className={`${s.color} text-2xl mb-3`} />
                <div className={`text-4xl font-black mb-1 ${s.color}`}>
                  <Counter end={s.end} suffix={s.suffix} />
                </div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Assessments ── */}
      <section id="assessments" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <FontAwesomeIcon icon={faFire} /> 3 Core Assessments
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Real challenges.<br /><span className="gradient-text">Real scores.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Each assessment is designed to measure a specific skill set. Complete all three to unlock your overall career readiness score.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {assessments.map((a,i) => (
              <div key={i} className={`reveal card-hover border ${a.border} ${a.bg} rounded-3xl overflow-hidden`}
                style={{ transitionDelay:`${i*120}ms` }}>
                {/* Photo */}
                <div className="relative h-48 overflow-hidden">
                  <img src={a.img} alt={a.title} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent`} />
                  <div className={`absolute top-4 left-4 w-10 h-10 bg-gradient-to-br ${a.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <FontAwesomeIcon icon={a.icon} className="text-white" />
                  </div>
                  <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full border ${a.border} ${a.bg} text-white`}>
                    {a.tag}
                  </span>
                </div>
                {/* Content */}
                <div className="p-6">
                  <h3 className="text-white font-black text-xl mb-2">{a.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-5">{a.desc}</p>
                  <button onClick={() => navigate('/register')}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${a.gradient} flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
                    <FontAwesomeIcon icon={faPlay} /> Try this assessment
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Unlock indicator */}
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            {[
              { label:'Typing', icon:faUnlock, color:'text-cyan-400' },
              { label:'→', icon:null, color:'text-gray-600' },
              { label:'Programming', icon:faLock, color:'text-violet-400' },
              { label:'→', icon:null, color:'text-gray-600' },
              { label:'Flowchart', icon:faLock, color:'text-emerald-400' },
              { label:'→', icon:null, color:'text-gray-600' },
              { label:'Career Score', icon:faTrophy, color:'text-amber-400' },
            ].map((item,i) => (
              <div key={i} className={`flex items-center gap-1.5 text-sm font-semibold ${item.color}`}>
                {item.icon && <FontAwesomeIcon icon={item.icon} />}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo break section ── */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="reveal-left">
              <div className="relative rounded-3xl overflow-hidden h-80">
                <img src={PHOTOS.students} alt="Students working" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#04040f]/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Tomas Claudio Colleges
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal-right">
              <div className="inline-flex items-center gap-2 border border-pink-500/30 bg-pink-500/10 text-pink-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
                <FontAwesomeIcon icon={faGraduationCap} /> For TCC Students
              </div>
              <h2 className="text-4xl font-black text-white mb-5 tracking-tight leading-tight">
                Built specifically for <span className="gradient-text-green">TCC students</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                ProFolio is the official skills assessment platform of Tomas Claudio Colleges for BSIT, BSCS, and BSIS programs. Your scores are tied to your student profile and evaluated by your own faculty.
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
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <FontAwesomeIcon icon={faChartLine} /> How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              From sign-up to <span className="gradient-text">certified</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Five steps to your official career readiness report.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-emerald-500/30" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {steps.map((s,i) => (
                <div key={i} className="reveal flex flex-col items-center text-center" style={{ transitionDelay:`${i*100}ms` }}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg relative z-10`}>
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

      {/* ── Career photo section ── */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <img src={PHOTOS.career} alt="Career ready professional" className="w-full h-64 md:h-80 object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#04040f] via-[#04040f]/70 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 md:px-16">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold px-4 py-2 rounded-full mb-4">
                  <FontAwesomeIcon icon={faMedal} /> Career Ready
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                  A verified score that<br /><span className="gradient-text">employers trust</span>
                </h2>
                <p className="text-gray-400 mb-6">Your career readiness report is backed by AI evaluation and expert human review — not just a self-reported portfolio.</p>
                <button onClick={() => navigate('/register')}
                  className="relative text-white font-bold px-6 py-3 rounded-xl overflow-hidden group inline-flex items-center gap-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:opacity-90 transition-opacity" />
                  <span className="relative">Get Your Report Free</span>
                  <FontAwesomeIcon icon={faArrowRight} className="relative" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold px-4 py-2 rounded-full mb-5">
              <FontAwesomeIcon icon={faStar} /> Student Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              What students <span className="gradient-text">say</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t,i) => (
              <div key={i} className="reveal card-hover border border-white/8 bg-white/[0.03] rounded-3xl p-7"
                style={{ transitionDelay:`${i*120}ms` }}>
                <FontAwesomeIcon icon={faQuoteLeft} className="text-blue-500/30 text-3xl mb-5" />
                <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex gap-1 mb-5">
                  {[...Array(t.rating)].map((_,j) => <FontAwesomeIcon key={j} icon={faStar} className="text-amber-400 text-xs" />)}
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.course} · TCC</p>
                  </div>
                </div>
              </div>
            ))}
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
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-pink-600/20" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />
            <img src={PHOTOS.team} alt="Team" className="absolute inset-0 w-full h-full object-cover opacity-10" />

            <div className="relative z-10 p-12 md:p-20 text-center">
              <div className="inline-flex items-center gap-2 border border-green-500/30 bg-green-500/10 text-green-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Free for all TCC Students
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Ready to prove<br /><span className="gradient-text">your skills?</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Join hundreds of Tomas Claudio students who are already building their verified skill profiles on ProFolio.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/register')}
                  className="group relative text-white font-bold px-10 py-4 rounded-2xl overflow-hidden text-base w-full sm:w-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 group-hover:opacity-90 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    Start Free <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                <button onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-2xl transition-all text-base w-full sm:w-auto">
                  Sign In <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ProFolio" className="w-8 h-8 object-contain" />
            <span className="text-white font-black">Pro<span className="gradient-text">Folio</span></span>
            <span className="text-gray-600 text-xs ml-2">Tomas Claudio Colleges</span>
          </div>
          <div className="flex items-center gap-3">
            {socialLinks.map((s,i) => (
              <a key={i} href={s.href} target="_blank" rel="noreferrer"
                className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all">
                <FontAwesomeIcon icon={s.icon} />
              </a>
            ))}
          </div>
          <p className="text-gray-700 text-xs">© 2026 ProFolio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage