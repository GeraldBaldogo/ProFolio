import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faUsers, faChartLine, faGear, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faTriangleExclamation,
  faUserTie, faGraduationCap, faShieldHalved, faArrowRight,
  faClipboardCheck, faStar, faFolder, faRobot, faPlus,
  faTrash, faPen, faXmark, faSave,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/admin/dashboard' },
  { label: 'User Management', icon: faUsers, path: '/admin/users' },
  { label: 'Analytics', icon: faChartLine, path: '/admin/analytics' },
]

const roleConfig = {
  student: { label: 'Student', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: faGraduationCap },
  evaluator: { label: 'Evaluator', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: faUserTie },
  admin: { label: 'Admin', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: faShieldHalved },
}

const statusConfig = {
  draft: { label: 'Draft', color: 'text-gray-400' },
  submitted: { label: 'Submitted', color: 'text-blue-400' },
  ai_reviewed: { label: 'AI Reviewed', color: 'text-violet-400' },
  under_review: { label: 'Under Review', color: 'text-amber-400' },
  revision_requested: { label: 'Needs Revision', color: 'text-rose-400' },
  completed: { label: 'Completed', color: 'text-green-400' },
}

const inputClass = "w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all"
const labelClass = "text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignForm, setAssignForm] = useState({ portfolio_id: '', evaluator_id: '' })
  const [portfolios, setPortfolios] = useState([])
  const [evaluators, setEvaluators] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingPortfolios, setLoadingPortfolios] = useState(false)

  useEffect(() => { fetchData() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
      ])
      setAnalytics(analyticsRes.data.data)
      setUsers(usersRes.data.data)
      setEvaluators(usersRes.data.data.filter(u => u.role === 'evaluator'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPortfolios = async () => {
    setLoadingPortfolios(true)
    try {
      const res = await api.get('/admin/portfolios')
      // Only show portfolios that are submitted or ai_reviewed (ready for assignment)
      const assignable = (res.data.data || []).filter(
        p => ['submitted', 'ai_reviewed', 'under_review'].includes(p.status)
      )
      setPortfolios(assignable)
    } catch (err) {
      console.error(err)
      showToast('Failed to load portfolios.', 'error')
    } finally {
      setLoadingPortfolios(false)
    }
  }

  const openAssignForm = () => {
    setAssignForm({ portfolio_id: '', evaluator_id: '' })
    setShowAssignForm(true)
    fetchPortfolios()
  }

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role })
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
      showToast('Role updated successfully!')
    } catch (err) {
      showToast('Failed to update role.', 'error')
    }
  }

  const toggleStatus = async (userId, is_active) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active })
      setUsers(users.map(u => u.id === userId ? { ...u, is_active } : u))
      showToast(`User ${is_active ? 'activated' : 'deactivated'} successfully!`)
    } catch (err) {
      showToast('Failed to update status.', 'error')
    }
  }

  const assignEvaluator = async () => {
    if (!assignForm.portfolio_id || !assignForm.evaluator_id) {
      showToast('Please select both a portfolio and an evaluator.', 'error')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/assign-evaluator', assignForm)
      showToast('Evaluator assigned successfully!')
      setShowAssignForm(false)
      setAssignForm({ portfolio_id: '', evaluator_id: '' })
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign evaluator.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const statCards = analytics ? [
    { label: 'Total Users', value: analytics.users.total, icon: faUsers, gradient: 'from-blue-500 to-cyan-500', sub: `${analytics.users.students} students · ${analytics.users.evaluators} evaluators` },
    { label: 'Total Portfolios', value: analytics.portfolios.total, icon: faFolder, gradient: 'from-violet-500 to-purple-600', sub: `${analytics.portfolios.submitted} submitted · ${analytics.portfolios.completed} completed` },
    { label: 'Evaluations', value: analytics.evaluations.total, icon: faClipboardCheck, gradient: 'from-amber-500 to-orange-500', sub: `${analytics.evaluations.passed} passed` },
    { label: 'Avg Score', value: analytics.evaluations.average_score || '—', icon: faStar, gradient: 'from-emerald-500 to-teal-600', sub: 'Average final score' },
  ] : []

  // Get selected portfolio details for preview
  const selectedPortfolio = portfolios.find(p => p.id === assignForm.portfolio_id)
  const selectedEvaluator = evaluators.find(e => e.id === assignForm.evaluator_id)

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
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-rose-400 text-xs">Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-rose-500/15 text-white border border-rose-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-rose-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-rose-400 rounded-full" />}
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
            <h1 className="text-white font-bold text-lg">Admin Dashboard</h1>
            <p className="text-gray-500 text-xs">Manage ProFolio system</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={openAssignForm}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            >
              <FontAwesomeIcon icon={faPlus} /> Assign Evaluator
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-rose-400 text-3xl animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 hover:border-white/15 transition-all">
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-white text-sm" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-gray-500 text-xs mb-0.5">{stat.label}</p>
                    <p className="text-gray-600 text-xs">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Assign Evaluator Modal Form */}
              {showAssignForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-md bg-[#0e0e20] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faUserTie} className="text-rose-400 text-sm" />
                        </div>
                        <p className="text-white font-bold">Assign Evaluator</p>
                      </div>
                      <button onClick={() => setShowAssignForm(false)} className="text-gray-500 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="px-6 py-5 flex flex-col gap-4">

                      {/* Portfolio Dropdown */}
                      <div>
                        <label className={labelClass}>Portfolio *</label>
                        {loadingPortfolios ? (
                          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Loading portfolios...
                          </div>
                        ) : portfolios.length === 0 ? (
                          <div className="bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-gray-500 text-sm">
                            No portfolios available for assignment
                          </div>
                        ) : (
                          <select
                            className={inputClass}
                            value={assignForm.portfolio_id}
                            onChange={e => setAssignForm({ ...assignForm, portfolio_id: e.target.value })}
                          >
                            <option value="">Select portfolio</option>
                            {portfolios.map(p => {
                              const studentName = p.student_profiles?.users?.full_name || 'Unknown Student'
                              const status = statusConfig[p.status]
                              return (
                                <option key={p.id} value={p.id}>
                                  {studentName} — {status?.label || p.status}
                                </option>
                              )
                            })}
                          </select>
                        )}

                        {/* Portfolio preview */}
                        {selectedPortfolio && (
                          <div className="mt-2 bg-white/5 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {selectedPortfolio.student_profiles?.users?.full_name?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-semibold truncate">
                                {selectedPortfolio.student_profiles?.users?.full_name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {selectedPortfolio.student_profiles?.course} · {selectedPortfolio.student_profiles?.school}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold ml-auto flex-shrink-0 ${statusConfig[selectedPortfolio.status]?.color}`}>
                              {statusConfig[selectedPortfolio.status]?.label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Evaluator Dropdown */}
                      <div>
                        <label className={labelClass}>Evaluator *</label>
                        <select
                          className={inputClass}
                          value={assignForm.evaluator_id}
                          onChange={e => setAssignForm({ ...assignForm, evaluator_id: e.target.value })}
                        >
                          <option value="">Select evaluator</option>
                          {evaluators.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.full_name}</option>
                          ))}
                        </select>

                        {/* Evaluator preview */}
                        {selectedEvaluator && (
                          <div className="mt-2 bg-white/5 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {selectedEvaluator.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white text-xs font-semibold">{selectedEvaluator.full_name}</p>
                              <p className="text-gray-500 text-xs">{selectedEvaluator.email}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={assignEvaluator}
                          disabled={saving || !assignForm.portfolio_id || !assignForm.evaluator_id}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-all"
                        >
                          {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faSave} />}
                          {saving ? 'Assigning...' : 'Assign Evaluator'}
                        </button>
                        <button
                          onClick={() => setShowAssignForm(false)}
                          className="border border-white/8 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Management */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">User Management</h2>
                  <span className="text-gray-500 text-xs">{users.length} users</span>
                </div>
                <div className="divide-y divide-white/5">
                  {users.map((u, i) => {
                    const role = roleConfig[u.role] || roleConfig.student
                    return (
                      <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all">
                        <div className={`w-10 h-10 bg-gradient-to-br ${u.role === 'admin' ? 'from-rose-500 to-pink-600' : u.role === 'evaluator' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-violet-500'} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {u.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{u.full_name}</p>
                          <p className="text-gray-500 text-xs truncate">{u.email}</p>
                        </div>
                        <select
                          value={u.role}
                          onChange={e => updateRole(u.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${role.bg} ${role.border} ${role.color} bg-transparent outline-none cursor-pointer`}
                        >
                          <option value="student">Student</option>
                          <option value="evaluator">Evaluator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => toggleStatus(u.id, !u.is_active)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${u.is_active ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-400'}`}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    )
                  })}
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

export default AdminDashboard