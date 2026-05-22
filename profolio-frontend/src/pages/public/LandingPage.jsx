import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBriefcase, faRobot, faUserTie, faArrowRight, faFolder,
  faCertificate, faTrophy, faStar, faChevronRight, faCheck,
  faQuoteLeft, faChartLine, faUsers, faFileAlt, faBars, faTimes,
  faCode, faShieldHalved, faBolt, faGraduationCap, faLightbulb,
  faCircleCheck, faMedal,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { useState, useEffect, useRef } from 'react'
import logo from "../../assets/ProFolio_-_Logo-removebg-preview.png";

// Slide components rendered as SVG-based UI cards
const slides = [
  {
    id: 1,
    label: 'Portfolio Dashboard',
    color: 'from-blue-500 to-cyan-500',
    content: (
      <div className="w-full h-full flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">GB</div>
          <div>
            <p className="text-white text-sm font-bold">Gerald Baldogo</p>
            <p className="text-gray-500 text-xs">BSIT — 3rd Year · Tomas Claudio Colleges</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs">Active</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['Projects', '4', 'from-blue-500 to-cyan-500'], ['Skills', '12', 'from-violet-500 to-purple-600'], ['Certs', '3', 'from-amber-500 to-orange-500']].map(([label, val, grad], i) => (
            <div key={i} className="border border-white/8 bg-white/5 rounded-xl p-3 text-center">
              <div className={`text-2xl font-black bg-gradient-to-br ${grad} bg-clip-text text-transparent`}>{val}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          ))}
        </div>
        <div className="border border-white/8 bg-white/5 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-2">Top Skills</p>
          {[['React', 85], ['Node.js', 72], ['Python', 60]].map(([skill, pct], i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>{skill}</span><span>{pct}%</span></div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 border border-white/8 bg-white/5 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Status</p>
            <p className="text-blue-400 text-sm font-bold">AI Reviewed</p>
          </div>
          <div className="flex-1 border border-white/8 bg-white/5 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Score</p>
            <p className="text-white text-sm font-black">87<span className="text-gray-500 font-normal">/100</span></p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    label: 'AI Evaluation Report',
    color: 'from-violet-500 to-purple-600',
    content: (
      <div className="w-full h-full flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faRobot} className="text-violet-400 text-sm" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">AI Evaluation</p>
            <p className="text-gray-500 text-xs">Powered by Claude AI</p>
          </div>
          <div className="ml-auto border border-green-500/30 bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full">Complete</div>
        </div>
        <div className="border border-white/8 bg-white/5 rounded-xl p-4 text-center">
          <div className="text-5xl font-black text-violet-400 mb-1">87<span className="text-2xl text-gray-500">/100</span></div>
          <p className="text-gray-500 text-xs">Overall Portfolio Score</p>
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-8 h-1.5 rounded-full ${i < 4 ? 'bg-violet-500' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
        <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-3">
          <p className="text-green-400 text-xs font-semibold mb-1">✓ Strengths</p>
          <p className="text-gray-400 text-xs leading-relaxed">Strong project portfolio with real-world applications. Good variety of technical skills across frontend and backend.</p>
        </div>
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3">
          <p className="text-amber-400 text-xs font-semibold mb-1">⚠ Suggestions</p>
          <p className="text-gray-400 text-xs leading-relaxed">Add live demo links to projects. Consider adding more backend certifications.</p>
        </div>
      </div>
    )
  },
  {
    id: 3,
    label: 'Project Showcase',
    color: 'from-emerald-500 to-teal-600',
    content: (
      <div className="w-full h-full flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faCode} className="text-emerald-400 text-sm" />
          </div>
          <p className="text-white text-sm font-bold">Projects</p>
          <div className="ml-auto border border-white/10 bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">4 projects</div>
        </div>
        {[
          { title: 'ProFolio System', stack: ['React', 'Node.js', 'AI'], score: 92, color: 'from-blue-500 to-cyan-500' },
          { title: 'E-Commerce App', stack: ['Vue', 'Laravel', 'MySQL'], score: 85, color: 'from-emerald-500 to-teal-500' },
          { title: 'Task Manager', stack: ['React Native', 'Firebase'], score: 78, color: 'from-amber-500 to-orange-500' },
        ].map((proj, i) => (
          <div key={i} className="border border-white/8 bg-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${proj.color} flex items-center justify-center flex-shrink-0`}>
              <FontAwesomeIcon icon={faCode} className="text-white text-xs" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{proj.title}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {proj.stack.map((t, j) => (
                  <span key={j} className="bg-white/10 text-gray-400 text-xs px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-white text-sm font-black">{proj.score}</div>
              <div className="text-gray-500 text-xs">score</div>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 4,
    label: 'Human Evaluation',
    color: 'from-rose-500 to-pink-600',
    content: (
      <div className="w-full h-full flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faUserTie} className="text-rose-400 text-sm" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Human Evaluation</p>
            <p className="text-gray-500 text-xs">By Prof. Santos</p>
          </div>
        </div>
        <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-4 text-center">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-3xl mb-2" />
          <div className="text-green-400 text-lg font-black mb-0.5">PASSED</div>
          <div className="text-gray-500 text-xs">Career Readiness: <span className="text-green-400 font-semibold">Developing</span></div>
        </div>
        <div className="border border-white/8 bg-white/5 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-2 font-semibold">Final Score</p>
          <div className="flex items-end gap-2">
            <div className="text-4xl font-black text-white">82</div>
            <div className="text-gray-500 text-sm mb-1">/100</div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full" style={{ width: '82%' }} />
          </div>
        </div>
        <div className="border border-white/8 bg-white/5 rounded-xl p-3">
          <p className="text-gray-400 text-xs font-semibold mb-1">Evaluator Comments</p>
          <p className="text-gray-400 text-xs leading-relaxed">"Gerald shows strong potential as a frontend developer. Keep building more real-world projects."</p>
        </div>
      </div>
    )
  },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const slideInterval = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const startAutoSlide = () => {
    slideInterval.current = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length)
        setIsAnimating(false)
      }, 300)
    }, 3500)
  }

  useEffect(() => {
    startAutoSlide()
    return () => clearInterval(slideInterval.current)
  }, [])

  const goToSlide = (index) => {
    clearInterval(slideInterval.current)
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setIsAnimating(false)
      startAutoSlide()
    }, 300)
  }

  const features = [
    { icon: faFolder, gradient: 'from-blue-500 to-cyan-500', title: 'Portfolio Builder', desc: 'Build a complete digital portfolio for any computer-related field — IT, CS, IS, developers, designers, and more.' },
    { icon: faRobot, gradient: 'from-violet-500 to-purple-600', title: 'AI-Powered Feedback', desc: 'Claude AI instantly evaluates your portfolio and gives you actionable suggestions before your human review.' },
    { icon: faUserTie, gradient: 'from-sky-500 to-blue-600', title: 'Human Evaluation', desc: 'Expert evaluators give the final career readiness assessment — holistic, fair, and professional.' },
    { icon: faChartLine, gradient: 'from-emerald-500 to-teal-600', title: 'Skill Rating System', desc: 'Self-rate your skills and let AI validate them based on your actual project evidence.' },
    { icon: faCertificate, gradient: 'from-amber-500 to-orange-600', title: 'Certification Tracking', desc: 'Upload and display your certifications with issuer details and credential links for verification.' },
    { icon: faMedal, gradient: 'from-rose-500 to-pink-600', title: 'Career Readiness Report', desc: 'Receive an official career readiness report you can share with employers and recruiters.' },
  ]

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Sign up and set up your student profile', icon: faGraduationCap, color: 'from-blue-500 to-cyan-500' },
    { step: '02', title: 'Build Portfolio', desc: 'Add projects, skills, certs, and achievements', icon: faCode, color: 'from-violet-500 to-purple-600' },
    { step: '03', title: 'Submit', desc: 'Submit your portfolio for AI evaluation', icon: faArrowRight, color: 'from-sky-500 to-blue-600' },
    { step: '04', title: 'AI Review', desc: 'Claude AI gives instant feedback and scores', icon: faRobot, color: 'from-emerald-500 to-teal-600' },
    { step: '05', title: 'Expert Review', desc: 'Human evaluator gives final assessment', icon: faUserTie, color: 'from-amber-500 to-orange-600' },
    { step: '06', title: 'Get Results', desc: 'Receive your career readiness report', icon: faTrophy, color: 'from-rose-500 to-pink-600' },
  ]

  const stats = [
    { value: '500+', label: 'Students Evaluated', icon: faUsers },
    { value: '95%', label: 'Satisfaction Rate', icon: faStar },
    { value: '3 mins', label: 'Avg AI Response', icon: faBolt },
    { value: '100%', label: 'Free to Use', icon: faShieldHalved },
  ]

  const testimonials = [
    { name: 'Maria Santos', course: 'BSCS — 4th Year', school: 'Polytechnic University of the Philippines', quote: 'ProFolio helped me organize everything in one place. The AI feedback was spot on — it pointed out gaps I never noticed.', rating: 5, avatar: 'MS', color: 'from-blue-500 to-cyan-500' },
    { name: 'Juan dela Cruz', course: 'BSIT — 3rd Year', school: 'De La Salle University', quote: 'My evaluator was impressed with how professional my portfolio looked. I got hired 2 weeks after submitting!', rating: 5, avatar: 'JD', color: 'from-violet-500 to-purple-600' },
    { name: 'Andrea Reyes', course: 'BSCS — Graduating', school: 'University of the Philippines', quote: 'The career readiness report was exactly what I needed to present to companies. Highly recommended!', rating: 5, avatar: 'AR', color: 'from-rose-500 to-pink-600' },
  ]

  const faqs = [
    { q: 'Is ProFolio free to use?', a: 'Yes! ProFolio is completely free for students. Create your account and start building your portfolio at no cost.' },
    { q: 'How does the AI evaluation work?', a: 'After you submit your portfolio, our AI powered by Claude analyzes your projects, skills, certifications, and achievements. It then provides a detailed report with scores, strengths, weaknesses, and specific suggestions for improvement.' },
    { q: 'Who are the human evaluators?', a: 'Human evaluators are industry professionals and faculty members assigned by your institution. They review your portfolio alongside the AI report to give a final, holistic career readiness assessment.' },
    { q: 'Can I update my portfolio after submitting?', a: 'Yes! If your evaluator requests revisions, you can update your portfolio and resubmit. You can also keep your portfolio updated at any time before submission.' },
    { q: 'Can employers see my portfolio?', a: 'Once your evaluation is complete, you get a shareable public link that you can send to employers and recruiters to showcase your verified portfolio.' },
  ]

  const socialLinks = [
    { href: 'https://www.instagram.com/gerald.baldogo/', icon: faInstagram, label: 'Instagram' },
    { href: 'https://www.facebook.com/gerald.baldogo/', icon: faFacebook, label: 'Facebook' },
    { href: 'https://github.com/GeraldBaldogo', icon: faGithub, label: 'GitHub' },
    { href: 'https://www.linkedin.com/in/gerald-baldogo-06741440a/', icon: faLinkedin, label: 'LinkedIn' },
  ]

  return (
    <div className="min-h-screen bg-[#060612] font-sans overflow-x-hidden">

      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="orb w-[500px] h-[500px] bg-blue-600 -top-40 -left-40 pulse-slow opacity-10" />
        <div className="orb w-[400px] h-[400px] bg-violet-600 top-1/3 -right-32 float-delay opacity-10" />
        <div className="orb w-[300px] h-[300px] bg-cyan-500 bottom-1/4 left-1/4 float-delay-2 opacity-10" />
        <div className="orb w-[350px] h-[350px] bg-indigo-600 -bottom-20 right-1/3 pulse-slow opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="ProFolio Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-white tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {['features', 'how-it-works', 'testimonials', 'FAQs'].map((section) => (
              <a key={section} href={`#${section}`} className="text-gray-400 hover:text-white font-medium transition-all text-sm px-4 py-2 rounded-lg hover:bg-white/5 capitalize">
                {section.replace('-', ' ')}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white font-medium transition-colors text-sm px-4 py-2 rounded-lg hover:bg-white/5">Sign In</button>
            <button onClick={() => navigate('/register')} className="relative group text-white px-5 py-2.5 rounded-xl font-medium text-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all group-hover:from-blue-400 group-hover:to-cyan-400" />
              <span className="relative">Get Started Free</span>
            </button>
          </div>

          <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#060612]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-2">
            {['features', 'how-it-works', 'testimonials', 'faq'].map((section) => (
              <a key={section} href={`#${section}`} className="text-gray-400 text-sm capitalize py-2.5 px-3 rounded-lg hover:bg-white/5 hover:text-white transition-all" onClick={() => setMenuOpen(false)}>
                {section.replace('-', ' ')}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-white/5">
              <button onClick={() => navigate('/login')} className="text-gray-400 text-sm py-2.5 px-3 rounded-lg hover:bg-white/5 text-left">Sign In</button>
              <button onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">Get Started Free</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero — Split Layout */}
      <section className="relative min-h-screen flex items-center px-6 pt-20">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16">

          {/* Left — Text */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium px-5 py-2 rounded-full mb-8 float">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
              AI-Assisted Portfolio Evaluation Platform
              <FontAwesomeIcon icon={faRobot} className="text-blue-400 text-xs" />
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] mb-6 tracking-tight">
              Build Your
              <br />
              Portfolio,
              <br />
              <span className="shimmer-text">Get Recognized</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-lg mb-10 leading-relaxed">
              ProFolio is the platform for students in computer-related fields to showcase their work,
              receive AI-powered feedback, and get certified by expert evaluators.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <button
                onClick={() => navigate('/register')}
                className="group relative flex items-center gap-2 text-white px-8 py-4 rounded-xl font-semibold text-lg overflow-hidden w-full sm:w-auto justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all group-hover:from-blue-400 group-hover:to-cyan-500" />
                <span className="relative">Start for Free</span>
                <FontAwesomeIcon icon={faArrowRight} className="relative transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all w-full sm:w-auto justify-center"
              >
                Sign In <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
              </button>
            </div>

            <div className="flex flex-wrap gap-5">
              {['Free to use', 'AI-powered', 'Expert evaluators', 'Shareable'].map((badge, i) => (
                <span key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-blue-400" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Slider */}
          <div className="relative z-10 hidden lg:block">
            {/* Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} opacity-10 rounded-3xl blur-3xl transition-all duration-700`} />

            {/* Slide label */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className={`inline-flex items-center gap-2 border bg-gradient-to-r ${slides[currentSlide].color} bg-clip-text text-transparent text-xs font-semibold border-white/10 px-3 py-1 rounded-full transition-all duration-500`}>
                {slides[currentSlide].label}
              </div>
              <div className="text-gray-600 text-xs">{currentSlide + 1} / {slides.length}</div>
            </div>

            {/* Card */}
            <div className={`relative border border-white/8 bg-white/[0.03] rounded-3xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'}`}
              style={{ minHeight: '420px' }}>
              {/* Top accent line */}
              <div className={`h-0.5 bg-gradient-to-r ${slides[currentSlide].color} w-full`} />
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <div className="ml-3 flex-1 bg-white/5 rounded h-5 flex items-center px-2">
                  <span className="text-gray-600 text-xs">profolio.app</span>
                </div>
              </div>
              {/* Slide content */}
              {slides[currentSlide].content}
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`transition-all duration-300 rounded-full ${i === currentSlide ? 'w-6 h-2 bg-blue-400' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div
                key={currentSlide}
                className={`h-full bg-gradient-to-r ${slides[currentSlide].color} rounded-full`}
                style={{ animation: 'progress 3.5s linear forwards' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 text-center hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={stat.icon} className="text-blue-400" />
                </div>
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5">
              <FontAwesomeIcon icon={faLightbulb} className="text-xs" /> Features
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Everything you need to stand out</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">From building your portfolio to receiving expert evaluation — ProFolio has everything covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="group border border-white/8 bg-white/[0.03] rounded-2xl p-7 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg`}>
                  <FontAwesomeIcon icon={feature.icon} className="text-white text-lg" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5">
              <FontAwesomeIcon icon={faChartLine} className="text-xs" /> How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Simple, structured, and effective</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Six simple steps from sign-up to your official career readiness report.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((item, i) => (
              <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <FontAwesomeIcon icon={item.icon} className="text-white text-sm" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-mono mb-1">{item.step}</div>
                    <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5">
              <FontAwesomeIcon icon={faStar} className="text-xs" /> Testimonials
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">What students say</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Hear from students who have used ProFolio to advance their careers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-7 flex flex-col hover:border-white/15 hover:bg-white/[0.06] transition-all duration-300">
                <FontAwesomeIcon icon={faQuoteLeft} className="text-blue-500/30 text-2xl mb-5" />
                <p className="text-gray-300 leading-relaxed text-sm mb-6 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(t.rating)].map((_, j) => <FontAwesomeIcon key={j} icon={faStar} className="text-amber-400 text-xs" />)}
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <p className="text-gray-600 text-xs">{t.course}</p>
                    <p className="text-gray-600 text-xs">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5">
              <FontAwesomeIcon icon={faCheck} className="text-xs" /> FAQ
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Got questions?</h2>
            <p className="text-gray-400 text-lg">We have answers.</p>
          </div>
          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden hover:border-white/12 transition-all">
                <button className="w-full flex items-center justify-between px-6 py-5 text-left gap-4" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-white text-sm">{faq.q}</span>
                  <div className={`w-6 h-6 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${openFaq === i ? 'bg-blue-500/20 border-blue-500/30' : ''}`}>
                    <FontAwesomeIcon icon={faChevronRight} className={`text-gray-400 text-xs transition-transform duration-300 ${openFaq === i ? 'rotate-90 text-blue-400' : ''}`} />
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-white/5">
                    <p className="text-gray-400 text-sm leading-relaxed pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative border border-white/8 bg-white/[0.03] rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-violet-600/10" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Ready to get started?
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Build your portfolio today</h2>
              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Join hundreds of students in IT, CS, IS, and other computer-related fields who are already using ProFolio to get career-ready.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/register')} className="group relative flex items-center gap-2 text-white px-8 py-4 rounded-xl font-semibold text-lg overflow-hidden w-full sm:w-auto justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all group-hover:from-blue-400 group-hover:to-cyan-500" />
                  <span className="relative">Get Started Free</span>
                  <FontAwesomeIcon icon={faArrowRight} className="relative transition-transform group-hover:translate-x-1" />
                </button>
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all w-full sm:w-auto justify-center">
                  Sign In <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            {socialLinks.map((social, i) => (
              <a key={i} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}
                className="w-9 h-9 border border-white/8 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/8 transition-all">
                <FontAwesomeIcon icon={social.icon} />
              </a>
            ))}
          </div>
          <p className="text-gray-700 text-xs text-center">© 2026 ProFolio. Built for aspiring developers and tech professionals. All rights reserved.</p>
        </div>
      </footer>

      {/* Progress bar animation */}
      <style>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>

    </div>
  )
}

export default LandingPage