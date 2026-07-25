import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faCircleNotch, faTriangleExclamation,
  faCircleCheck, faTerminal, faCircle, faImage,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

// Same image the landing page uses for its hero, so the two pages feel like
// one product. Swap for a real TCC photo whenever you have one.
const SIDE_PHOTO = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1400&q=80'

// ─── Social providers config ───────────────────────────────────────────────────
// Each provider redirects to your Express OAuth route.
// Backend should handle: GET /auth/google, /auth/facebook, /auth/github
// and callback: GET /auth/google/callback, etc.
const SOCIAL_PROVIDERS = [
  {
    key: 'google',
    label: 'Google',
    icon: faGoogle,
    href: `${import.meta.env.VITE_API_URL}/auth/google`,
    iconColor: '#EA4335',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: faFacebook,
    href: `${import.meta.env.VITE_API_URL}/auth/facebook`,
    iconColor: '#1877F2',
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: faGithub,
    href: `${import.meta.env.VITE_API_URL}/auth/github`,
    iconColor: '#ffffff',
  },
]

// What a student walks away with — same three claims as the landing hero.
const PROMISES = [
  'Rubric-based scoring',
  'Anti-cheat monitored',
  'Human-reviewed',
]

const validate = (f) => {
  const e = {}
  if (!f.email.trim()) e.email = 'Enter your email.'
  else if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'That doesn\u2019t look like an email address.'
  if (!f.password) e.password = 'Enter your password.'
  return e
}

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFailed, setPhotoFailed] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    // clear the complaint as soon as they start fixing it
    setFieldErrors(v => ({ ...v, [name]: undefined }))
    setError('')
  }

  const handleBlur = (e) => {
    const { name } = e.target
    const found = validate(form)
    setFieldErrors(v => ({ ...v, [name]: found[name] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const found = validate(form)
    if (Object.keys(found).length) {
      setFieldErrors(found)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', {
        ...form,
        email: form.email.trim().toLowerCase(),
      })
      const { user, token } = res.data.data
      login(user, token)
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'evaluator') navigate('/evaluator/dashboard')
      else if (user.role === 'admin') navigate('/admin/dashboard')
      else navigate('/') // unknown role — don't strand them on this screen
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // shared input styling, so the two fields can't drift apart
  const inputBase = 'w-full bg-white/[0.04] rounded-2xl px-4 py-3.5 pl-11 text-white text-sm placeholder-gray-600 outline-none transition-all border'
  const inputState = (name) => fieldErrors[name]
    ? 'border-red-500/50 focus:border-red-400'
    : 'border-white/10 hover:border-white/20 focus:border-blue-400/60 focus:bg-blue-400/[0.06]'

  return (
    <div className="min-h-screen bg-[#0a0d10] font-sans grid lg:grid-cols-2">

      <style>{`
        @keyframes drift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(40px, -30px) scale(1.08); }
          66%  { transform: translate(-30px, 20px) scale(0.94); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-260%) skewX(-20deg); }
          100% { transform: translateX(360%) skewX(-20deg); }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

        a:focus-visible, button:focus-visible, input:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 3px;
          border-radius: 12px;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ══ The form — second column on wide screens, but first in the DOM so
           keyboard and screen-reader users reach it straight away ══ */}
      <div className="relative flex items-center justify-center px-6 py-12 lg:py-16 lg:order-2">

        {/* ambient background, same language as the landing page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[520px] h-[520px] rounded-full -top-40 -left-40 opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)', animation: 'drift 16s ease-in-out infinite' }} />
          <div className="absolute w-[420px] h-[420px] rounded-full -bottom-32 -right-24 opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', animation: 'drift 20s ease-in-out infinite 4s' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.8) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="w-full max-w-md relative z-10 rise">

          {/* Logo — clickable, back to the landing page */}
          <div className="flex justify-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img src={logo} alt="" className="h-9 w-auto" />
              <span className="text-xl font-black text-white tracking-tight">
                Pro<span className="text-blue-400">Folio</span>
              </span>
            </Link>
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-2">
            Welcome back.
          </h1>
          <p className="text-gray-400 mb-8">
            Sign in to pick up where you left off.
          </p>

          {/* Server-side error */}
          {error && (
            <div role="alert"
              className="flex items-start gap-3 border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3 rounded-2xl mb-6">
              <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  placeholder="you@email.com"
                  className={`${inputBase} ${inputState('email')}`}
                />
              </div>
              {fieldErrors.email && (
                <span id="email-error" className="text-red-400 text-xs">{fieldErrors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  placeholder="••••••••"
                  className={`${inputBase} pr-11 ${inputState('password')}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
              {fieldErrors.password && (
                <span id="password-error" className="text-red-400 text-xs">{fieldErrors.password}</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative overflow-hidden bg-blue-400 hover:bg-blue-300 text-black font-bold py-3.5 rounded-2xl text-sm mt-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!loading && (
                <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                  style={{ animation: 'shimmer 3.2s ease-in-out infinite' }} />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Social */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-gray-600 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {SOCIAL_PROVIDERS.map((p) => (
              <a
                key={p.key}
                href={p.href}
                aria-label={`Continue with ${p.label}`}
                className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white py-3 rounded-2xl text-sm font-semibold transition-all"
              >
                <FontAwesomeIcon icon={p.icon} className="text-base" style={{ color: p.iconColor }} />
                <span className="hidden sm:inline lg:hidden xl:inline">{p.label}</span>
              </a>
            ))}
          </div>

          {/* Register */}
          <p className="text-center text-sm text-gray-500 mt-8">
            No account yet?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>

          <div className="text-center mt-4">
            <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* ══ The reason to sign in — sits on the left ══ */}
      <div className="relative hidden lg:block overflow-hidden lg:order-1">
        {photoFailed ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#141d29] via-[#0d1218] to-[#0a0d10] flex items-center justify-center">
            <FontAwesomeIcon icon={faImage} className="text-white/10 text-3xl" />
          </div>
        ) : (
          <img
            src={SIDE_PHOTO}
            alt=""
            onError={() => setPhotoFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-bl from-[#0a0d10] via-[#0a0d10]/85 to-[#0a0d10]/60" />
        <div className="absolute inset-y-0 right-0 w-px bg-white/8" />

        <div className="relative h-full flex flex-col justify-center px-14 xl:px-20">
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Prove your <span className="text-blue-400">skills.</span><br />
            Launch your career.
          </h2>
          <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed">
            Six real challenges, scored against a fixed rubric, compiled into a portfolio you can hand to an employer.
          </p>

          <div className="flex flex-col gap-3 mb-12">
            {PROMISES.map((p, i) => (
              <span key={i} className="flex items-center gap-3 text-sm text-gray-400">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400" />{p}
              </span>
            ))}
          </div>

          {/* the same terminal panel from the landing hero, tying the two together */}
          <div className="max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-[#0d1218]/95 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-1.5 px-5 pt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="text-gray-600 text-[11px] font-mono ml-2">profolio — assessment.session</span>
            </div>
            <div className="p-5 pt-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                <FontAwesomeIcon icon={faTerminal} className="text-blue-400" /> waiting for sign in...
              </div>
              {[
                { w: 'w-3/5', c: 'bg-blue-400/60' },
                { w: 'w-4/5', c: 'bg-gray-700' },
                { w: 'w-2/5', c: 'bg-violet-400/50' },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-700 text-[10px] font-mono w-3">{i + 1}</span>
                  <div className={`h-2.5 rounded ${l.w} ${l.c}`} />
                </div>
              ))}
              <div className="mt-1 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-gray-600 text-[11px] font-mono">status</span>
                <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCircle} className="text-[6px]" /> ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage