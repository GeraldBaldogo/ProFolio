import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faFolder, faRobot, faStar, faUser, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faTriangleExclamation,
  faPen, faSave, faGraduationCap, faBuilding, faLink,
  faEnvelope, faBriefcase, faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/student/dashboard' },
  { label: 'My Portfolio', icon: faFolder, path: '/student/portfolio' },
  { label: 'AI Feedback', icon: faRobot, path: '/student/ai-feedback' },
  { label: 'Evaluation', icon: faStar, path: '/student/evaluation' },
  { label: 'Profile', icon: faUser, path: '/student/profile' },
]

const inputClass = "w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all"
const labelClass = "text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block"

const StudentProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    course: '',
    school: '',
    year_level: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    career_goal: '',
  })

  useEffect(() => { fetchProfile() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile')
      const p = res.data.data
      setForm({
        course: p?.course || '',
        school: p?.school || '',
        year_level: p?.year_level || '',
        bio: p?.bio || '',
        linkedin_url: p?.linkedin_url || '',
        github_url: p?.github_url || '',
        career_goal: p?.career_goal || '',
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      return res.data.data
    } catch {
      return null
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/student/profile', form)
      showToast('Profile updated successfully!')
      setEditing(false)
    } catch (err) {
      showToast('Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']

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
        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">My Profile</h1>
            <p className="text-gray-500 text-xs">Manage your personal information</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 border border-white/8 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                <FontAwesomeIcon icon={faPen} className="text-xs" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)}
                  className="border border-white/8 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-60">
                  {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faSave} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-6">

              {/* Profile Header Card */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-black text-3xl flex-shrink-0">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-black text-xl">{user?.full_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 text-xs" />
                      <p className="text-gray-400 text-sm">{user?.email}</p>
                    </div>
                    {form.course && (
                      <div className="flex items-center gap-2 mt-1">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-gray-500 text-xs" />
                        <p className="text-gray-400 text-sm">{form.course} — {form.year_level}</p>
                      </div>
                    )}
                    {form.school && (
                      <div className="flex items-center gap-2 mt-1">
                        <FontAwesomeIcon icon={faBuilding} className="text-gray-500 text-xs" />
                        <p className="text-gray-400 text-sm">{form.school}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {form.github_url && (
                      <a href={form.github_url} target="_blank" rel="noreferrer"
                        className="w-9 h-9 border border-white/8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
                        <FontAwesomeIcon icon={faGithub} />
                      </a>
                    )}
                    {form.linkedin_url && (
                      <a href={form.linkedin_url} target="_blank" rel="noreferrer"
                        className="w-9 h-9 border border-white/8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
                        <FontAwesomeIcon icon={faLinkedin} />
                      </a>
                    )}
                  </div>
                </div>

                {form.bio && !editing && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <FontAwesomeIcon icon={faQuoteLeft} className="text-blue-500/30 text-lg flex-shrink-0 mt-0.5" />
                      <p className="text-gray-400 text-sm leading-relaxed">{form.bio}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Form / Info Cards */}
              {editing ? (
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-6 flex flex-col gap-5">
                  <h3 className="text-white font-bold text-sm">Edit Profile Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Course / Program</label>
                      <input className={inputClass} placeholder="e.g. Bachelor of Science in IT"
                        value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Year Level</label>
                      <select className={inputClass} value={form.year_level} onChange={e => setForm({ ...form, year_level: e.target.value })}>
                        <option value="">Select year level</option>
                        {yearLevels.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>School / University</label>
                    <input className={inputClass} placeholder="e.g. Tomas Claudio Colleges"
                      value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
                  </div>

                  <div>
                    <label className={labelClass}>Bio / About Me</label>
                    <textarea className={inputClass + ' resize-none h-24'} placeholder="Tell us about yourself..."
                      value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                  </div>

                  <div>
                    <label className={labelClass}>Career Goal</label>
                    <input className={inputClass} placeholder="e.g. Aspiring Full-Stack Developer"
                      value={form.career_goal} onChange={e => setForm({ ...form, career_goal: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>GitHub URL</label>
                      <input className={inputClass} placeholder="https://github.com/..."
                        value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>LinkedIn URL</label>
                      <input className={inputClass} placeholder="https://linkedin.com/in/..."
                        value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Academic Info */}
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400 text-sm" />
                      </div>
                      <p className="text-white font-bold text-sm">Academic Information</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">Course</p>
                        <p className="text-white text-sm">{form.course || <span className="text-gray-600 italic">Not set</span>}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">Year Level</p>
                        <p className="text-white text-sm">{form.year_level || <span className="text-gray-600 italic">Not set</span>}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">School</p>
                        <p className="text-white text-sm">{form.school || <span className="text-gray-600 italic">Not set</span>}</p>
                      </div>
                    </div>
                  </div>

                  {/* Career Info */}
                  <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faBriefcase} className="text-violet-400 text-sm" />
                      </div>
                      <p className="text-white font-bold text-sm">Career Information</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">Career Goal</p>
                        <p className="text-white text-sm">{form.career_goal || <span className="text-gray-600 italic">Not set</span>}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">GitHub</p>
                        {form.github_url ? (
                          <a href={form.github_url} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:text-blue-300 transition-colors truncate block">
                            {form.github_url}
                          </a>
                        ) : <p className="text-gray-600 text-sm italic">Not set</p>}
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">LinkedIn</p>
                        {form.linkedin_url ? (
                          <a href={form.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:text-blue-300 transition-colors truncate block">
                            {form.linkedin_url}
                          </a>
                        ) : <p className="text-gray-600 text-sm italic">Not set</p>}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Account Info */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-emerald-400 text-sm" />
                  </div>
                  <p className="text-white font-bold text-sm">Account Information</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Full Name</p>
                    <p className="text-white text-sm">{user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Email</p>
                    <p className="text-white text-sm">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Role</p>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400 capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
          <FontAwesomeIcon icon={toast.type === 'error' ? faTriangleExclamation : faCircleCheck} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default StudentProfile