import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faUsers, faChartLine, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faTriangleExclamation,
  faUserTie, faGraduationCap, faShieldHalved,
  faClipboardCheck, faFolder, faClock, faRotateRight,
  faMagnifyingGlass, faUserSlash, faUserCheck, faBan,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/admin/dashboard' },
  { label: 'User Management', icon: faUsers, path: '/admin/users' },
  { label: 'Analytics', icon: faChartLine, path: '/admin/analytics' },
]

// 'evaluator' is the database role; everyone calls them professors.
const roleConfig = {
  student:   { label: 'Student',   color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/25',  icon: faGraduationCap, gradient: 'from-blue-500 to-violet-500' },
  evaluator: { label: 'Professor', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', icon: faUserTie,       gradient: 'from-amber-500 to-orange-500' },
  admin:     { label: 'Admin',     color: 'text-rose-400',  bg: 'bg-rose-500/10',  border: 'border-rose-500/25',  icon: faShieldHalved,  gradient: 'from-rose-500 to-pink-600' },
}

const Avatar = ({ name, gradient = 'from-rose-500 to-pink-600', size = 'w-9 h-9', text = 'text-sm' }) => (
  <div className={`${size} bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white font-bold ${text} flex-shrink-0`}>
    {name?.charAt(0)?.toUpperCase() || '?'}
  </div>
)

const AdminDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)

  const toastTimer = useRef(null)

  useEffect(() => {
    fetchData()
    return () => clearTimeout(toastTimer.current)
  }, [])

  const showToast = (message, type = 'success', action = null) => {
    clearTimeout(toastTimer.current)
    setToast({ message, type, action })
    // An undoable toast sticks around longer — 3.5s isn't enough to react.
    toastTimer.current = setTimeout(() => setToast(null), action ? 7000 : 3500)
  }

  const fetchData = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
      ])
      setAnalytics(analyticsRes.data.data)
      setUsers(usersRes.data.data || [])
    } catch (err) {
      // An empty screen and a broken screen shouldn't look the same.
      setLoadError(err.response?.data?.message || 'Couldn\u2019t load the dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // Professors who signed up but can't get in yet. These are the only accounts
  // that need a decision — everyone else is already settled.
  const pendingUsers = useMemo(
    () => users.filter(u => u.role === 'evaluator' && u.is_approved === false),
    [users]
  )

  // Everyone who's already through the door. Kept separate so a pending
  // professor never shows a Deactivate button — there's nothing to deactivate.
  const settledUsers = useMemo(
    () => users.filter(u => !(u.role === 'evaluator' && u.is_approved === false)),
    [users]
  )

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return settledUsers
    return settledUsers.filter(u =>
      u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }, [settledUsers, search])

  const approveUser = async (u) => {
    setBusyId(u.id)
    try {
      await api.patch(`/admin/users/${u.id}/approve`)
      setUsers(list => list.map(x => x.id === u.id ? { ...x, is_approved: true, is_active: true } : x))
      showToast(`${u.full_name} can now sign in.`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  // Rejecting doesn't delete the row — it leaves a record of who applied, and
  // the decision can be reversed later from the users list.
  const rejectUser = async (u) => {
    setBusyId(u.id)
    try {
      await api.patch(`/admin/users/${u.id}/status`, { is_active: false })
      setUsers(list => list.map(x => x.id === u.id ? { ...x, is_active: false } : x))
      showToast(`${u.full_name} was turned down.`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const updateRole = async (u, role) => {
    if (u.id === user?.id && role !== 'admin') {
      showToast('You can\u2019t remove your own admin access.', 'error')
      return
    }
    setBusyId(u.id)
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role })
      setUsers(list => list.map(x => x.id === u.id ? { ...x, role } : x))
      showToast(`${u.full_name} is now a ${roleConfig[role]?.label || role}.`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const toggleStatus = async (u) => {
    const next = !u.is_active
    if (u.id === user?.id && !next) {
      showToast('You can\u2019t deactivate your own account.', 'error')
      return
    }
    setBusyId(u.id)
    try {
      await api.patch(`/admin/users/${u.id}/status`, { is_active: next })
      setUsers(list => list.map(x => x.id === u.id ? { ...x, is_active: next } : x))
      showToast(
        next ? `${u.full_name} can sign in again.` : `${u.full_name} can no longer sign in.`,
        'success',
        // One click to put it back, so a mis-click costs nothing.
        { label: 'Undo', onClick: () => toggleStatus({ ...u, is_active: next }) }
      )
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  // Optional chaining throughout — a missing key in the analytics payload
  // should leave a dash on screen, not crash the whole dashboard.
  const statCards = analytics ? [
    {
      label: 'Total users', value: analytics.users?.total ?? '—', icon: faUsers,
      gradient: 'from-blue-500 to-cyan-500',
      sub: `${analytics.users?.students ?? 0} students · ${analytics.users?.evaluators ?? 0} professors`,
    },
    {
      label: 'Portfolios', value: analytics.portfolios?.total ?? '—', icon: faFolder,
      gradient: 'from-violet-500 to-purple-600',
      sub: `${analytics.portfolios?.submitted ?? 0} submitted · ${analytics.portfolios?.completed ?? 0} completed`,
    },
    {
      label: 'Evaluations', value: analytics.evaluations?.total ?? '—', icon: faClipboardCheck,
      gradient: 'from-amber-500 to-orange-500',
      sub: `${analytics.evaluations?.passed ?? 0} passed`,
    },
    {
      label: 'Waiting for you', value: pendingUsers.length, icon: faClock,
      gradient: 'from-rose-500 to-pink-600',
      sub: pendingUsers.length ? 'Professor accounts to review' : 'Nothing to review',
    },
  ] : []

  return (
    <div className="min-h-screen bg-[#0a0d10] flex font-sans">

      <style>{`
        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid #fb7185;
          outline-offset: 3px;
          border-radius: 12px;
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: riseIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ══ Sidebar ══ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1218] border-r border-white/8 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8">
          <img src={logo} alt="" className="w-8 h-8 object-contain" />
          <span className="text-lg font-black text-white tracking-tight">
            Pro<span className="text-blue-400">Folio</span>
          </span>
          <button aria-label="Close menu"
            className="ml-auto lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <Avatar name={user?.full_name} />
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
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-white border border-rose-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <FontAwesomeIcon icon={item.icon} className={`text-sm ${isActive ? 'text-rose-400' : ''}`} />
                {item.label}
                {/* A count here means the sidebar can nag without opening the page */}
                {item.path === '/admin/dashboard' && pendingUsers.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded-full">
                    {pendingUsers.length}
                  </span>
                )}
                {isActive && !(item.path === '/admin/dashboard' && pendingUsers.length > 0) && (
                  <span className="ml-auto w-1.5 h-1.5 bg-rose-400 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/8">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ══ Main ══ */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        <header className="sticky top-0 z-30 bg-[#0a0d10]/90 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex items-center gap-4">
          <button aria-label="Open menu"
            className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">Admin dashboard</h1>
            <p className="text-gray-500 text-xs">Accounts and system health</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {!loading && !loadError && (
              <button onClick={fetchData} aria-label="Refresh"
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all flex items-center justify-center">
                <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
              </button>
            )}
            <Avatar name={user?.full_name} />
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <FontAwesomeIcon icon={faSpinner} className="text-rose-400 text-3xl animate-spin" />
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>

          ) : loadError ? (
            <div className="max-w-md mx-auto mt-16 text-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400 text-3xl mb-4" />
              <p className="text-white font-bold mb-1">{loadError}</p>
              <p className="text-gray-500 text-sm mb-6">This is a connection problem, not an empty system.</p>
              <button onClick={fetchData}
                className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition-colors">
                <FontAwesomeIcon icon={faRotateRight} /> Try again
              </button>
            </div>

          ) : (
            <div className="flex flex-col gap-6 rise">

              {/* ══ 1. Waiting for approval — the one thing needing a decision ══ */}
              {pendingUsers.length > 0 && (
                <div className="border border-amber-500/30 bg-amber-500/[0.06] rounded-3xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-amber-500/20 flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-amber-400" />
                    <h2 className="text-white font-bold text-sm">Waiting for approval</h2>
                    <span className="ml-auto text-amber-300 text-xs font-semibold">
                      {pendingUsers.length} {pendingUsers.length === 1 ? 'professor' : 'professors'}
                    </span>
                  </div>

                  <div className="divide-y divide-amber-500/15">
                    {pendingUsers.map(u => {
                      const busy = busyId === u.id
                      return (
                        <div key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                          <Avatar name={u.full_name} gradient="from-amber-500 to-orange-500" size="w-10 h-10" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{u.full_name}</p>
                            <p className="text-gray-500 text-xs truncate">{u.email}</p>
                          </div>

                          {/* Approve or turn down — nothing else applies to an
                              account that hasn't been let in yet. */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => rejectUser(u)}
                              disabled={busy}
                              className="flex items-center gap-1.5 border border-white/10 text-gray-400 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                              <FontAwesomeIcon icon={faBan} /> Reject
                            </button>
                            <button
                              onClick={() => approveUser(u)}
                              disabled={busy}
                              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                              <FontAwesomeIcon icon={busy ? faSpinner : faCircleCheck}
                                className={busy ? 'animate-spin' : ''} />
                              Approve
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="px-5 py-3 text-gray-500 text-xs border-t border-amber-500/15">
                    An approved professor can sign in, create tests, and grade submissions.
                  </p>
                </div>
              )}

              {/* ══ 2. Numbers ══ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-3xl p-5 hover:border-white/15 transition-all">
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mb-3`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-white text-sm" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1 font-mono">{stat.value}</p>
                    <p className="text-gray-400 text-xs mb-0.5">{stat.label}</p>
                    <p className="text-gray-600 text-xs">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* ══ 3. Everyone already through the door ══ */}
              <div className="border border-white/8 bg-white/[0.03] rounded-3xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center gap-3">
                  <h2 className="text-white font-bold text-sm">Accounts</h2>
                  <span className="text-gray-500 text-xs">
                    {visibleUsers.length}{search && ` of ${settledUsers.length}`}
                  </span>
                  <div className="relative ml-auto w-full sm:w-64">
                    <FontAwesomeIcon icon={faMagnifyingGlass}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                    <input
                      type="search"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search name or email"
                      aria-label="Search accounts"
                      className="w-full bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-rose-400/60 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder-gray-600 outline-none transition-all"
                    />
                  </div>
                </div>

                {visibleUsers.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 text-sm">
                      {search ? `No one matches "${search}".` : 'No accounts yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/8">
                    {visibleUsers.map((u) => {
                      const role = roleConfig[u.role] || roleConfig.student
                      const isSelf = u.id === user?.id
                      const busy = busyId === u.id
                      const off = u.is_active === false
                      return (
                        <div key={u.id}
                          className={`flex flex-wrap items-center gap-4 px-5 py-4 transition-all ${
                            off ? 'opacity-50' : 'hover:bg-white/[0.02]'
                          }`}>
                          <Avatar name={u.full_name} gradient={role.gradient} size="w-10 h-10" />

                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate flex items-center gap-2">
                              {u.full_name}
                              {isSelf && <span className="text-gray-600 text-xs font-normal">(you)</span>}
                            </p>
                            <p className="text-gray-500 text-xs truncate">{u.email}</p>
                          </div>

                          {/* State — read-only, says what they ARE */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex-shrink-0 ${
                            off
                              ? 'text-rose-300 border-rose-500/30 bg-rose-500/10'
                              : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                          }`}>
                            {off ? 'Deactivated' : 'Active'}
                          </span>

                          {/* Role */}
                          <select
                            value={u.role}
                            disabled={busy || isSelf}
                            onChange={e => updateRole(u, e.target.value)}
                            aria-label={`Role for ${u.full_name}`}
                            className={`text-xs font-semibold px-2.5 py-2 rounded-xl border ${role.bg} ${role.border} ${role.color} outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0`}
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <option value="student" className="bg-[#0d1218]">Student</option>
                            <option value="evaluator" className="bg-[#0d1218]">Professor</option>
                            <option value="admin" className="bg-[#0d1218]">Admin</option>
                          </select>

                          {/* Action — says what it DOES, not what they are */}
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={busy || isSelf}
                            title={isSelf ? 'You cannot change your own account' : undefined}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-40 ${
                              off
                                ? 'border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40'
                                : 'border-white/10 text-gray-400 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-400'
                            }`}>
                            <FontAwesomeIcon icon={busy ? faSpinner : (off ? faUserCheck : faUserSlash)}
                              className={busy ? 'animate-spin' : ''} />
                            {off ? 'Reactivate' : 'Deactivate'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite"
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold rise ${
            toast.type === 'error'
              ? 'border-rose-500/30 bg-[#0d1218] text-rose-300'
              : 'border-emerald-500/30 bg-[#0d1218] text-emerald-300'
          }`}>
          <FontAwesomeIcon icon={toast.type === 'error' ? faTriangleExclamation : faCircleCheck} />
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => { toast.action.onClick(); setToast(null) }}
              className="ml-2 underline underline-offset-2 hover:no-underline text-white font-bold">
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard