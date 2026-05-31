import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faCircleNotch, faTriangleExclamation,
  faUser, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// ─── Social providers config ───────────────────────────────────────────────────
const SOCIAL_PROVIDERS = [
  {
    key: 'google',
    label: 'Continue with Google',
    icon: faGoogle,
    href: `${import.meta.env.VITE_API_URL}/auth/google`,
    iconColor: '#EA4335',
  },
  {
    key: 'facebook',
    label: 'Continue with Facebook',
    icon: faFacebook,
    href: `${import.meta.env.VITE_API_URL}/auth/facebook`,
    iconColor: '#1877F2',
  },
  {
    key: 'github',
    label: 'Continue with GitHub',
    icon: faGithub,
    href: `${import.meta.env.VITE_API_URL}/auth/github`,
    iconColor: '#ffffff',
  },
]

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'student',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
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

  const passwordStrength = () => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' }
    if (p.length < 8) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' }
    if (p.length < 12) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center px-6 py-12 relative overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="orb w-[500px] h-[500px] bg-blue-600 -top-40 -right-40 pulse-slow opacity-10" />
        <div className="orb w-[400px] h-[400px] bg-violet-600 -bottom-32 -left-32 float-delay opacity-10" />
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
            Create your <span className="text-blue-400">ProFolio</span> account
          </h1>
          <p className="text-gray-500 text-sm mt-1">Start building your portfolio today — it's free</p>
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

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faUser} className="text-sm" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Juan dela Cruz"
                  className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-3 pl-11 text-white text-sm placeholder-gray-600 outline-none transition-all"
                />
              </div>
            </div>

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

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'student', label: 'Student', desc: 'Build my portfolio' },
                  { value: 'evaluator', label: 'Evaluator', desc: 'Review portfolios' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      form.role === r.value
                        ? 'border-blue-500/50 bg-blue-500/10 text-white'
                        : 'border-white/8 bg-white/5 text-gray-400 hover:border-white/15 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {form.role === r.value && (
                        <FontAwesomeIcon icon={faCircleCheck} className="text-blue-400 text-xs" />
                      )}
                      <span className="text-sm font-semibold">{r.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{r.desc}</span>
                  </button>
                ))}
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
                  placeholder="Min. 8 characters"
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
              {strength && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
                  </div>
                  <span className={`text-xs font-medium ${
                    strength.label === 'Weak' ? 'text-red-400' :
                    strength.label === 'Fair' ? 'text-amber-400' :
                    strength.label === 'Good' ? 'text-blue-400' : 'text-green-400'
                  }`}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faLock} className="text-sm" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 pl-11 pr-11 text-white text-sm placeholder-gray-600 outline-none transition-all ${
                    form.confirm_password && form.password !== form.confirm_password
                      ? 'border-red-500/50 bg-red-500/5'
                      : form.confirm_password && form.password === form.confirm_password
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="text-sm" />
                </button>
                {form.confirm_password && form.password === form.confirm_password && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-sm" />
                  </div>
                )}
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
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </span>
            </button>

          </form>

          {/* Divider — or continue with */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-gray-600 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* ── Social Buttons ── */}
          <div className="flex gap-3 mb-6">
            {SOCIAL_PROVIDERS.map((provider) => (
              <a
                key={provider.key}
                href={provider.href}
                title={provider.label}
                className="flex-1 flex items-center justify-center gap-2 border border-white/8 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 hover:text-white py-3 rounded-xl text-sm font-semibold transition-all"
              >
                <FontAwesomeIcon
                  icon={provider.icon}
                  className="text-base"
                  style={{ color: provider.iconColor }}
                />
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-gray-600 text-xs">Already have an account?</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Login link */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 text-gray-300 hover:text-white py-3 rounded-xl text-sm font-semibold transition-all"
          >
            Sign in instead
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

export default RegisterPage