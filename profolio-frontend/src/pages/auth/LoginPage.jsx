import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faCircleNotch, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      const { user, token } = res.data.data
      login(user, token)
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'evaluator') navigate('/evaluator/dashboard')
      else if (user.role === 'admin') navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center px-6 relative overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="orb w-[500px] h-[500px] bg-blue-600 -top-40 -left-40 pulse-slow opacity-10" />
        <div className="orb w-[400px] h-[400px] bg-violet-600 -bottom-32 -right-32 float-delay opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-blue-500/30 rounded-3xl blur-xl" />
            <img src={logo} alt="ProFolio" className="relative w-16 h-16 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome back to <span className="text-blue-400">ProFolio</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue to your dashboard</p>
        </div>

        {/* Card */}
        <div className="border border-white/8 bg-white/[0.03] rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-black/50">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
              <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@email.com"
                  className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-3 pl-11 text-white text-sm placeholder-gray-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faLock} className="text-sm" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-3 pl-11 pr-11 text-white text-sm placeholder-gray-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex items-center justify-center gap-3 text-white py-3.5 rounded-xl font-bold text-sm overflow-hidden mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:from-blue-400 group-hover:to-cyan-500" />
              <span className="relative">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </span>
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-gray-600 text-xs">Don't have an account?</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Register link */}
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 text-gray-300 hover:text-white py-3 rounded-xl text-sm font-semibold transition-all"
          >
            Create an account
          </Link>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            ← Back to home
          </Link>
        </div>

      </div>
    </div>
  )
}

export default LoginPage