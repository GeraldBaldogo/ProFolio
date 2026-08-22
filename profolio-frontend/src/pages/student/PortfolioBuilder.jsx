import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faPlus, faTrash, faPen, faCheck, faChevronRight, faChevronDown,
  faCode, faCertificate, faTrophy, faChartLine, faBriefcase,
  faRightFromBracket, faSpinner, faArrowRight, faBell, faClipboardList, 
  faCircleCheck, faTriangleExclamation, faXmark, faSave, faComments,
  faFileAlt, faFingerprint, faLightbulb,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'AI Feedback', icon: faRobot, path: '/student/ai-feedback' },
  { label: 'Evaluation', icon: faStar, path: '/student/evaluation' },
  { label: 'Assigned Tests', icon: faClipboardList, path: '/student/assigned-tests' },
  { label: 'Assessment', icon: faTrophy, path: '/student/assessment' },
  { label: 'Messages', icon: faComments, path: '/student/messages' },
  { label: 'CV Builder', icon: faFileAlt, path: '/student/cv' },
  { label: 'Originality Check', icon: faFingerprint, path: '/student/originality' },
  { label: 'My Results', icon: faChartLine, path: '/student/results' },
  { label: 'Recommendations', icon: faLightbulb, path: '/student/recommendations' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const SECTIONS = [
  { key: 'projects', label: 'Projects', icon: faCode, color: 'from-blue-500 to-cyan-500' },
  { key: 'skills', label: 'Skills', icon: faChartLine, color: 'from-violet-500 to-purple-600' },
  { key: 'certifications', label: 'Certifications', icon: faCertificate, color: 'from-amber-500 to-orange-500' },
  { key: 'experiences', label: 'Experience', icon: faBriefcase, color: 'from-sky-500 to-blue-600' },
  { key: 'achievements', label: 'Achievements', icon: faTrophy, color: 'from-emerald-500 to-teal-600' },
]

const inputClass = "w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all"
const labelClass = "text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block"

const PortfolioBuilder = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('projects')
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [certifications, setCertifications] = useState([])
  const [experiences, setExperiences] = useState([])
  const [achievements, setAchievements] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPortfolio() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/portfolios/my')
      const portfolios = res.data.data
      if (portfolios.length > 0) {
        setPortfolio(portfolios[0])
        await fetchSectionData(portfolios[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSectionData = async (portfolioId) => {
    try {
      const [projRes, skillRes, certRes, expRes, achRes] = await Promise.all([
        api.get(`/projects/${portfolioId}`),
        api.get(`/portfolio-items/skills/${portfolioId}`),
        api.get(`/portfolio-items/certifications/${portfolioId}`),
        api.get(`/portfolio-items/experiences/${portfolioId}`),
        api.get(`/portfolio-items/achievements/${portfolioId}`),
      ])
      setProjects(projRes.data.data)
      setSkills(skillRes.data.data)
      setCertifications(certRes.data.data)
      setExperiences(expRes.data.data)
      setAchievements(achRes.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  const createPortfolio = async () => {
    try {
      const res = await api.post('/portfolios')
      setPortfolio(res.data.data)
      showToast('Portfolio created!')
    } catch (err) {
      showToast('Failed to create portfolio.', 'error')
    }
  }

  const submitPortfolio = async () => {
    setSubmitting(true)
    try {
      await api.patch(`/portfolios/${portfolio.id}/submit`)
      showToast('Portfolio submitted for evaluation!')
      fetchPortfolio()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getDefaultForm = (section) => {
    const defaults = {
      projects: { title: '', description: '', tech_stack: '', github_url: '', live_url: '' },
      skills: { skill_name: '', category: '', self_rating: 5 },
      certifications: { title: '', issuer: '', credential_url: '', issued_date: '' },
      experiences: { company: '', role: '', description: '', start_date: '', end_date: '', is_current: false },
      achievements: { title: '', description: '', category: '', achieved_date: '' },
    }
    return defaults[section] || {}
  }

  const openForm = (item = null) => {
    setEditItem(item)
    setFormData(item ? { ...item } : getDefaultForm(activeSection))
    setShowForm(true)
    // Scroll to form on mobile
    setTimeout(() => {
      document.getElementById('portfolio-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditItem(null)
    setFormData({})
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeSection === 'projects') {
        if (editItem) {
          const res = await api.patch(`/projects/${editItem.id}`, formData)
          setProjects(projects.map(p => p.id === editItem.id ? res.data.data : p))
        } else {
          const res = await api.post(`/projects/${portfolio.id}`, formData)
          setProjects([...projects, res.data.data])
        }
      } else {
        const endpoint = `/portfolio-items/${activeSection}/${portfolio.id}`
        const patchEndpoint = `/portfolio-items/${activeSection}/${editItem?.id}`
        if (editItem) {
          const res = await api.patch(patchEndpoint, formData)
          const setter = { skills: setSkills, certifications: setCertifications, experiences: setExperiences, achievements: setAchievements }
          const getter = { skills, certifications, experiences, achievements }
          setter[activeSection](getter[activeSection].map(i => i.id === editItem.id ? res.data.data : i))
        } else {
          const res = await api.post(endpoint, formData)
          const setter = { skills: setSkills, certifications: setCertifications, experiences: setExperiences, achievements: setAchievements }
          const getter = { skills, certifications, experiences, achievements }
          setter[activeSection]([...getter[activeSection], res.data.data])
        }
      }
      showToast(editItem ? 'Updated successfully!' : 'Added successfully!')
      closeForm()
    } catch (err) {
      showToast('Failed to save. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      if (activeSection === 'projects') {
        await api.delete(`/projects/${id}`)
        setProjects(projects.filter(p => p.id !== id))
      } else {
        await api.delete(`/portfolio-items/${activeSection}/${id}`)
        const setter = { skills: setSkills, certifications: setCertifications, experiences: setExperiences, achievements: setAchievements }
        const getter = { skills, certifications, experiences, achievements }
        setter[activeSection](getter[activeSection].filter(i => i.id !== id))
      }
      showToast('Deleted successfully!')
    } catch (err) {
      showToast('Failed to delete.', 'error')
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const getCurrentData = () => {
    const map = { projects, skills, certifications, experiences, achievements }
    return map[activeSection] || []
  }

  const renderItem = (item) => {
    switch (activeSection) {
      case 'projects':
        return (
          <div>
            <p className="text-white font-semibold text-sm">{item.title}</p>
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.description}</p>
            {item.tech_stack && <p className="text-blue-400 text-xs mt-1">{item.tech_stack}</p>}
          </div>
        )
      case 'skills':
        return (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-semibold text-sm">{item.skill_name}</p>
              <span className="text-gray-400 text-xs">{item.self_rating}/10</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full" style={{ width: `${(item.self_rating / 10) * 100}%` }} />
            </div>
            {item.category && <p className="text-gray-500 text-xs mt-1">{item.category}</p>}
          </div>
        )
      case 'certifications':
        return (
          <div>
            <p className="text-white font-semibold text-sm">{item.title}</p>
            <p className="text-gray-500 text-xs mt-0.5">{item.issuer}</p>
            {item.issued_date && <p className="text-amber-400 text-xs mt-1">{item.issued_date}</p>}
          </div>
        )
      case 'experiences':
        return (
          <div>
            <p className="text-white font-semibold text-sm">{item.role}</p>
            <p className="text-gray-500 text-xs mt-0.5">{item.company}</p>
            <p className="text-sky-400 text-xs mt-1">{item.start_date} — {item.is_current ? 'Present' : item.end_date}</p>
          </div>
        )
      case 'achievements':
        return (
          <div>
            <p className="text-white font-semibold text-sm">{item.title}</p>
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.description}</p>
            {item.category && <p className="text-emerald-400 text-xs mt-1">{item.category}</p>}
          </div>
        )
      default:
        return null
    }
  }

  const renderForm = () => {
    switch (activeSection) {
      case 'projects':
        return (
          <div className="flex flex-col gap-4">
            <div><label className={labelClass}>Project Title *</label><input className={inputClass} placeholder="e.g. ProFolio System" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass + ' resize-none h-24'} placeholder="Describe your project..." value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><label className={labelClass}>Tech Stack</label><input className={inputClass} placeholder="e.g. React, Node.js, Supabase" value={formData.tech_stack || ''} onChange={e => setFormData({ ...formData, tech_stack: e.target.value })} /></div>
            {/* Single column on mobile, 2 cols on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>GitHub URL</label><input className={inputClass} placeholder="https://github.com/..." value={formData.github_url || ''} onChange={e => setFormData({ ...formData, github_url: e.target.value })} /></div>
              <div><label className={labelClass}>Live URL</label><input className={inputClass} placeholder="https://..." value={formData.live_url || ''} onChange={e => setFormData({ ...formData, live_url: e.target.value })} /></div>
            </div>
          </div>
        )
      case 'skills':
        return (
          <div className="flex flex-col gap-4">
            <div><label className={labelClass}>Skill Name *</label><input className={inputClass} placeholder="e.g. React, Python, UI/UX" value={formData.skill_name || ''} onChange={e => setFormData({ ...formData, skill_name: e.target.value })} /></div>
            <div><label className={labelClass}>Category</label><input className={inputClass} placeholder="e.g. Frontend, Backend, Design" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} /></div>
            <div>
              <label className={labelClass}>Self Rating: {formData.self_rating || 5}/10</label>
              <input type="range" min="1" max="10" value={formData.self_rating || 5} onChange={e => setFormData({ ...formData, self_rating: parseInt(e.target.value) })} className="w-full accent-violet-500" />
              <div className="flex justify-between text-gray-600 text-xs mt-1"><span>1 - Beginner</span><span>10 - Expert</span></div>
            </div>
          </div>
        )
      case 'certifications':
        return (
          <div className="flex flex-col gap-4">
            <div><label className={labelClass}>Certificate Title *</label><input className={inputClass} placeholder="e.g. AWS Cloud Practitioner" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><label className={labelClass}>Issuer</label><input className={inputClass} placeholder="e.g. Amazon Web Services" value={formData.issuer || ''} onChange={e => setFormData({ ...formData, issuer: e.target.value })} /></div>
            <div><label className={labelClass}>Credential URL</label><input className={inputClass} placeholder="https://..." value={formData.credential_url || ''} onChange={e => setFormData({ ...formData, credential_url: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>Date Issued</label><input type="date" className={inputClass} value={formData.issued_date || ''} onChange={e => setFormData({ ...formData, issued_date: e.target.value })} /></div>
              <div><label className={labelClass}>Expiry Date</label><input type="date" className={inputClass} value={formData.expiry_date || ''} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} /></div>
            </div>
          </div>
        )
      case 'experiences':
        return (
          <div className="flex flex-col gap-4">
            <div><label className={labelClass}>Company / Organization *</label><input className={inputClass} placeholder="e.g. Tomas Claudio Colleges" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} /></div>
            <div><label className={labelClass}>Role / Position *</label><input className={inputClass} placeholder="e.g. Web Development Intern" value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass + ' resize-none h-24'} placeholder="Describe your responsibilities..." value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>Start Date</label><input type="date" className={inputClass} value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} /></div>
              <div><label className={labelClass}>End Date</label><input type="date" className={inputClass} value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} disabled={formData.is_current} /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_current || false} onChange={e => setFormData({ ...formData, is_current: e.target.checked, end_date: '' })} className="accent-blue-500" />
              <span className="text-gray-400 text-sm">Currently working here</span>
            </label>
          </div>
        )
      case 'achievements':
        return (
          <div className="flex flex-col gap-4">
            <div><label className={labelClass}>Achievement Title *</label><input className={inputClass} placeholder="e.g. 1st Place — Hackathon 2025" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass + ' resize-none h-24'} placeholder="Describe your achievement..." value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>Category</label><input className={inputClass} placeholder="e.g. Competition, Academic" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} /></div>
              <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={formData.achieved_date || ''} onChange={e => setFormData({ ...formData, achieved_date: e.target.value })} /></div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const activeSection_ = SECTIONS.find(s => s.key === activeSection)

  return (
    <div className="min-h-screen bg-[#060612] flex font-sans">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a18] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-md" />
            <img src={logo} alt="ProFolio" className="relative w-8 h-8 object-contain" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
          <button className="ml-auto lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-500/15 text-white border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-blue-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4 flex items-center gap-3">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base sm:text-lg">My Portfolio</h1>
            <p className="text-gray-500 text-xs hidden sm:block">Build and manage your portfolio</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {portfolio && portfolio.status === 'draft' && (
              <button
                onClick={submitPortfolio}
                disabled={submitting}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-cyan-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition-all disabled:opacity-60"
              >
                {submitting
                  ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  : <FontAwesomeIcon icon={faArrowRight} />}
                <span className="hidden xs:inline">Submit</span>
                <span className="hidden sm:inline"> Portfolio</span>
              </button>
            )}
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
            </div>
          ) : !portfolio ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faFolder} className="text-blue-400 text-2xl" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">No portfolio yet</h2>
              <p className="text-gray-500 text-sm mb-6">Create your portfolio to get started</p>
              <button onClick={createPortfolio} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                <FontAwesomeIcon icon={faPlus} /> Create Portfolio
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-6">

              {/* Portfolio status bar */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Portfolio Status</p>
                    <p className="text-white font-bold capitalize">{portfolio.status.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto flex-wrap text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCode} className="text-blue-400 text-[10px]" />
                      {projects.length} projects
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faChartLine} className="text-violet-400 text-[10px]" />
                      {skills.length} skills
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCertificate} className="text-amber-400 text-[10px]" />
                      {certifications.length} certs
                    </span>
                  </div>
                </div>
              </div>

              {/* Section tabs — scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {SECTIONS.map((section) => {
                  const count = { projects, skills, certifications, experiences, achievements }[section.key]?.length || 0
                  return (
                    <button
                      key={section.key}
                      onClick={() => { setActiveSection(section.key); setShowForm(false) }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeSection === section.key ? 'bg-blue-500/15 text-white border border-blue-500/20' : 'border border-white/8 bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06]'}`}
                    >
                      <FontAwesomeIcon icon={section.icon} className={`text-xs ${activeSection === section.key ? 'text-blue-400' : ''}`} />
                      {/* Hide label on very small screens, show icon only */}
                      <span className="hidden xs:inline sm:inline">{section.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeSection === section.key ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-gray-600'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Section content */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">

                {/* Section header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br ${activeSection_.color} rounded-lg flex items-center justify-center`}>
                      <FontAwesomeIcon icon={activeSection_.icon} className="text-white text-xs" />
                    </div>
                    <h2 className="text-white font-bold text-sm">{activeSection_.label}</h2>
                  </div>
                  {!showForm && portfolio.status === 'draft' && (
                    <button
                      onClick={() => openForm()}
                      className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 text-blue-400 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl transition-all"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      <span className="hidden sm:inline">Add {activeSection_.label.slice(0, -1)}</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  )}
                </div>

                {/* Form */}
                {showForm && (
                  <div id="portfolio-form" className="px-4 sm:px-5 py-5 border-b border-white/5 bg-blue-500/[0.03]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-sm">{editItem ? 'Edit' : 'Add'} {activeSection_.label.slice(0, -1)}</h3>
                      <button onClick={closeForm} className="text-gray-500 hover:text-white transition-colors p-1">
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                    {renderForm()}
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                      >
                        {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faSave} />}
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={closeForm} className="border border-white/8 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div className="divide-y divide-white/5">
                  {getCurrentData().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center px-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${activeSection_.color} opacity-20 rounded-xl flex items-center justify-center mb-3`}>
                        <FontAwesomeIcon icon={activeSection_.icon} className="text-white text-lg" />
                      </div>
                      <p className="text-gray-500 text-sm">No {activeSection_.label.toLowerCase()} yet</p>
                      <p className="text-gray-600 text-xs mt-1">Click "Add" to get started</p>
                    </div>
                  ) : (
                    getCurrentData().map((item) => (
                      <div key={item.id} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-white/[0.02] transition-all">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br ${activeSection_.color} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <FontAwesomeIcon icon={activeSection_.icon} className="text-white text-xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {renderItem(item)}
                        </div>
                        {portfolio.status === 'draft' && (
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <button
                              onClick={() => openForm(item)}
                              className="w-7 h-7 sm:w-8 sm:h-8 border border-white/8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            >
                              <FontAwesomeIcon icon={faPen} className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-7 h-7 sm:w-8 sm:h-8 border border-white/8 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast — full width on mobile, auto on desktop */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold transition-all ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
          <FontAwesomeIcon icon={toast.type === 'error' ? faTriangleExclamation : faCircleCheck} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default PortfolioBuilder