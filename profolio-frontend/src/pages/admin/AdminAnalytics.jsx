import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faUsers, faChartLine, faBars, faTimes,
  faRightFromBracket, faSpinner, faCircleCheck, faTriangleExclamation,
  faFolder, faClipboardCheck, faStar, faUserTie, faGraduationCap,
  faChartBar, faCircleHalfStroke,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const navItems = [
  { label: 'Dashboard', icon: faHouse, path: '/admin/dashboard' },
  { label: 'User Management', icon: faUsers, path: '/admin/users' },
  { label: 'Analytics', icon: faChartLine, path: '/admin/analytics' },
]

const AdminAnalytics = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics')
      setAnalytics(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const BarChart = ({ value, max, color }) => (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
      />
    </div>
  )

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
            <h1 className="text-white font-bold text-lg">Analytics</h1>
            <p className="text-gray-500 text-xs">System overview and statistics</p>
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
          ) : analytics && (
            <div className="flex flex-col gap-6">

              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: analytics.users.total, icon: faUsers, gradient: 'from-blue-500 to-cyan-500' },
                  { label: 'Total Portfolios', value: analytics.portfolios.total, icon: faFolder, gradient: 'from-violet-500 to-purple-600' },
                  { label: 'Evaluations Done', value: analytics.evaluations.total, icon: faClipboardCheck, gradient: 'from-amber-500 to-orange-500' },
                  { label: 'Avg Score', value: analytics.evaluations.average_score > 0 ? `${analytics.evaluations.average_score}` : '—', icon: faStar, gradient: 'from-emerald-500 to-teal-600' },
                ].map((stat, i) => (
                  <div key={i} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-white text-sm" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-gray-500 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Users Breakdown */}
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faUsers} className="text-blue-400 text-sm" />
                    </div>
                    <p className="text-white font-bold text-sm">Users Breakdown</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'Students', value: analytics.users.students, color: 'bg-blue-500', textColor: 'text-blue-400' },
                      { label: 'Evaluators', value: analytics.users.evaluators, color: 'bg-amber-500', textColor: 'text-amber-400' },
                      { label: 'Admins', value: analytics.users.total - analytics.users.students - analytics.users.evaluators, color: 'bg-rose-500', textColor: 'text-rose-400' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-gray-400 text-xs">{item.label}</span>
                          <span className={`text-xs font-bold ${item.textColor}`}>{item.value}</span>
                        </div>
                        <BarChart value={item.value} max={analytics.users.total} color={item.color} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Status Breakdown */}
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faFolder} className="text-violet-400 text-sm" />
                    </div>
                    <p className="text-white font-bold text-sm">Portfolio Status</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'Submitted / Active', value: analytics.portfolios.submitted, color: 'bg-blue-500', textColor: 'text-blue-400' },
                      { label: 'Completed', value: analytics.portfolios.completed, color: 'bg-green-500', textColor: 'text-green-400' },
                      { label: 'Draft', value: analytics.portfolios.total - analytics.portfolios.submitted, color: 'bg-gray-500', textColor: 'text-gray-400' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-gray-400 text-xs">{item.label}</span>
                          <span className={`text-xs font-bold ${item.textColor}`}>{item.value}</span>
                        </div>
                        <BarChart value={item.value} max={analytics.portfolios.total} color={item.color} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evaluation Summary */}
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faClipboardCheck} className="text-amber-400 text-sm" />
                    </div>
                    <p className="text-white font-bold text-sm">Evaluation Summary</p>
                  </div>
                  {analytics.evaluations.total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FontAwesomeIcon icon={faChartBar} className="text-gray-700 text-3xl mb-3" />
                      <p className="text-gray-500 text-sm">No evaluations yet</p>
                      <p className="text-gray-600 text-xs mt-1">Data will appear once evaluations are submitted.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-400 text-xs">Total Evaluated</span>
                        <span className="text-white font-bold text-sm">{analytics.evaluations.total}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                        <span className="text-gray-400 text-xs">Passed</span>
                        <span className="text-green-400 font-bold text-sm">{analytics.evaluations.passed}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                        <span className="text-gray-400 text-xs">Average Score</span>
                        <span className="text-violet-400 font-bold text-sm">{analytics.evaluations.average_score || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-400 text-xs">Pass Rate</span>
                        <span className="text-white font-bold text-sm">
                          {analytics.evaluations.total > 0
                            ? `${Math.round((analytics.evaluations.passed / analytics.evaluations.total) * 100)}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* System Health */}
                <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faCircleHalfStroke} className="text-emerald-400 text-sm" />
                    </div>
                    <p className="text-white font-bold text-sm">System Overview</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      {
                        label: 'Portfolio Completion Rate',
                        value: analytics.portfolios.total > 0
                          ? `${Math.round((analytics.portfolios.completed / analytics.portfolios.total) * 100)}%`
                          : '—',
                        color: 'text-green-400',
                      },
                      {
                        label: 'Portfolios Pending Evaluation',
                        value: analytics.portfolios.submitted - analytics.evaluations.total > 0
                          ? analytics.portfolios.submitted - analytics.evaluations.total
                          : 0,
                        color: 'text-amber-400',
                      },
                      {
                        label: 'Evaluator-to-Student Ratio',
                        value: analytics.users.students > 0
                          ? `1 : ${Math.round(analytics.users.students / Math.max(analytics.users.evaluators, 1))}`
                          : '—',
                        color: 'text-blue-400',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-400 text-xs">{item.label}</span>
                        <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminAnalytics