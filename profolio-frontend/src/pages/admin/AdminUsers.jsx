import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faUsers, faChartLine, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faTriangleExclamation,
  faUserTie, faGraduationCap, faShieldHalved, faMagnifyingGlass,
  faFilter,
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
  student: { label: 'Student', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  evaluator: { label: 'Evaluator', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  admin: { label: 'Admin', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
}

const inputClass = "w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all"

const AdminUsers = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => { fetchUsers() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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

  const handleLogout = () => { logout(); navigate('/') }

  const filtered = users.filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const counts = {
    all: users.length,
    student: users.filter(u => u.role === 'student').length,
    evaluator: users.filter(u => u.role === 'evaluator').length,
    admin: users.filter(u => u.role === 'admin').length,
  }

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

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-[#060612]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">User Management</h1>
            <p className="text-gray-500 text-xs">Manage all ProFolio users</p>
          </div>
          <div className="ml-auto">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FontAwesomeIcon icon={faSpinner} className="text-rose-400 text-3xl animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: counts.all, gradient: 'from-blue-500 to-cyan-500' },
                  { label: 'Students', value: counts.student, gradient: 'from-violet-500 to-purple-600' },
                  { label: 'Evaluators', value: counts.evaluator, gradient: 'from-amber-500 to-orange-500' },
                  { label: 'Admins', value: counts.admin, gradient: 'from-rose-500 to-pink-600' },
                ].map((s, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className={`w-8 h-8 bg-gradient-to-br ${s.gradient} rounded-lg flex items-center justify-center mb-3`}>
                      <FontAwesomeIcon icon={faUsers} className="text-white text-xs" />
                    </div>
                    <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm" />
                  <input type="text" placeholder="Search by name or email..."
                    className={inputClass + ' pl-10'}
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="relative">
                  <FontAwesomeIcon icon={faFilter} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm" />
                  <select className={inputClass + ' pl-10 sm:w-44'} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="evaluator">Evaluators</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">All Users</h2>
                  <span className="text-gray-500 text-xs">{filtered.length} users</span>
                </div>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FontAwesomeIcon icon={faUsers} className="text-gray-700 text-4xl mb-4" />
                    <p className="text-gray-400 text-sm">No users found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filtered.map((u, i) => {
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
                          <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${role.bg} ${role.border} ${role.color} flex-shrink-0`}>
                            {role.label}
                          </span>
                          <select
                            value={u.role}
                            onChange={e => updateRole(u.id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${role.bg} ${role.border} ${role.color} bg-transparent outline-none cursor-pointer flex-shrink-0`}
                          >
                            <option value="student">Student</option>
                            <option value="evaluator">Evaluator</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => toggleStatus(u.id, !u.is_active)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${u.is_active ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-400'}`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
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

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
          <FontAwesomeIcon icon={toast.type === 'error' ? faTriangleExclamation : faCircleCheck} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default AdminUsers