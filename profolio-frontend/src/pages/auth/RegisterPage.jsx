import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ThemePicker from '../../components/ThemePicker'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope, faLock, faEye, faEyeSlash,
  faArrowRight, faCircleNotch, faTriangleExclamation,
  faUser, faCircleCheck, faImage, faClock,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

const SIDE_PHOTO = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1400&q=80'

const SOCIAL_PROVIDERS = [
  { key: 'google',   label: 'Google',   icon: faGoogle,   href: `${import.meta.env.VITE_API_URL}/auth/google`,   iconColor: '#EA4335' },
  { key: 'facebook', label: 'Facebook', icon: faFacebook, href: `${import.meta.env.VITE_API_URL}/auth/facebook`, iconColor: '#1877F2' },
  { key: 'github',   label: 'GitHub',   icon: faGithub,   href: `${import.meta.env.VITE_API_URL}/auth/github`,   iconColor: '#ffffff' },
]

// 'evaluator' is the database role; "Professor" is what everyone calls it.
const ROLES = [
  { value: 'student', label: 'Student', desc: 'Take the assessments' },
  { value: 'evaluator', label: 'Professor', desc: 'Set and grade work' },
]

const WHAT_YOU_DO = ['Typing', 'Coding', 'Bug fix', 'SQL', 'Flowchart', 'Communication']

const scorePassword = (p) => {
  if (!p) return null
  if (p.length < 8) return { label: 'Too short', color: 'bg-red-500', text: 'text-red-400', width: 'w-1/4' }
  let variety = 0
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) variety++
  if (/\d/.test(p)) variety++
  if (/[^A-Za-z0-9]/.test(p)) variety++
  if (p.length >= 12) variety++
  if (variety <= 1) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400', width: 'w-2/4' }
  if (variety === 2) return { label: 'Good', color: 'bg-blue-400', text: 'text-blue-400', width: 'w-3/4' }
  return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: 'w-full' }
}

const validate = (f) => {
  const e = {}
  if (!f.full_name.trim()) e.full_name = 'Enter your full name.'
  else if (f.full_name.trim().length < 2) e.full_name = 'That name looks too short.'
  if (!f.email.trim()) e.email = 'Enter your email.'
  else if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'That doesn\u2019t look like an email address.'
  if (!f.password) e.password = 'Choose a password.'
  else if (f.password.length < 8) e.password = 'Use at least 8 characters.'
  if (!f.confirm_password) e.confirm_password = 'Re-enter your password.'
  else if (f.password !== f.confirm_password) e.confirm_password = 'The two passwords don\u2019t match.'
  return e
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', role: 'student',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFailed, setPhotoFailed] = useState(false)
  // Professor accounts come back without a token — they wait for an admin.
  const [pending, setPending] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
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
      const res = await api.post('/auth/register', {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      })

      const data = res.data.data

      // No token means the account exists but isn't usable yet. Redirecting
      // here is what caused the flash-and-bounce back to login.
      if (data?.pending || !data?.token) {
        setPending(true)
        return
      }

      const { user, token } = data
      login(user, token)
      if (user.role === 'student') navigate('/student/dashboard')
      else if (user.role === 'evaluator') navigate('/evaluator/dashboard')
      else if (user.role === 'admin') navigate('/admin/dashboard')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = scorePassword(form.password)
  const matches = form.confirm_password && form.password === form.confirm_password

  const inputBase = 'w-full bg-white/[0.04] rounded-xl px-4 py-3 pl-11 text-white text-[15px] placeholder-gray-600 outline-none transition-all border'
  const inputState = (name) => fieldErrors[name]
    ? 'border-rose-500/50 focus:border-rose-400'
    : 'border-white/10 hover:border-white/20 focus:border-blue-400/60 focus:bg-blue-400/[0.06]'

  // ── Waiting-for-approval screen ──
  if (pending) {
    return (
      <div className="min-h-screen bg-[#060612] font-sans flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src={logo} alt="" className="h-9 w-auto" />
              <span className="text-xl font-black text-white tracking-tight">
                Pro<span className="brand-gradient">Folio</span>
              </span>
            </Link>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faClock} className="text-amber-400 text-xl" />
          </div>

          <h1 className="text-[28px] font-bold text-white tracking-[-0.02em] mb-3">
            Account created.
          </h1>
          <p className="text-gray-400 leading-relaxed mb-2">
            Professor accounts need an admin to approve them first. You&apos;ll be able
            to sign in as soon as that happens.
          </p>
          <p className="text-gray-600 text-sm mb-8">
            Signed up as <span className="text-gray-400">{form.email.trim().toLowerCase()}</span>
          </p>

          <Link to="/login"
            className="inline-flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-300 text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            Back to sign in
          </Link>

          <div className="mt-4">
            <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#060612] font-sans grid lg:grid-cols-2">

      <div className="fixed top-5 right-5 z-40">
        <ThemePicker />
      </div>

      <style>{`
        /* Matches the landing page. Uses the theme's accent variables so the
           wordmark follows whichever colour is selected. */
        .brand-gradient {
          background: linear-gradient(100deg, var(--accent-300), var(--accent-500));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

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

      <div className="relative flex items-center justify-center px-6 py-10 lg:py-8 lg:order-2 lg:h-screen lg:overflow-y-auto">

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[520px] h-[520px] rounded-full -top-40 -right-40 opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)', animation: 'drift 16s ease-in-out infinite' }} />
          <div className="absolute w-[420px] h-[420px] rounded-full -bottom-32 -left-24 opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', animation: 'drift 20s ease-in-out infinite 4s' }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.8) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="w-full max-w-md relative z-10 rise">

          <div className="flex justify-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img src={logo} alt="" className="h-9 w-auto" />
              <span className="text-xl font-black text-white tracking-tight">
                Pro<span className="brand-gradient">Folio</span>
              </span>
            </Link>
          </div>

          <h1 className="text-[32px] font-bold text-white tracking-[-0.025em] leading-tight mb-1.5">
            Create your account.
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Free for every student. Takes about a minute.
          </p>

          {error && (
            <div role="alert"
              className="flex items-start gap-3 border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3 rounded-xl mb-6">
              <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            <div className="grid sm:grid-cols-2 gap-4 items-start">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="full_name" className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Full name
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" />
                  <input
                    id="full_name" type="text" name="full_name"
                    value={form.full_name} onChange={handleChange} onBlur={handleBlur}
                    autoComplete="name"
                    aria-invalid={!!fieldErrors.full_name}
                    aria-describedby={fieldErrors.full_name ? 'full_name-error' : undefined}
                    placeholder="Juan dela Cruz"
                    className={`${inputBase} ${inputState('full_name')}`}
                  />
                </div>
                {fieldErrors.full_name && (
                  <span id="full_name-error" className="text-red-400 text-xs">{fieldErrors.full_name}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" />
                  <input
                    id="email" type="email" name="email"
                    value={form.email} onChange={handleChange} onBlur={handleBlur}
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
            </div>

            <div className="flex flex-col gap-1.5">
              <span id="role-label" className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                I am a
              </span>
              <div role="radiogroup" aria-labelledby="role-label" className="grid grid-cols-2 gap-2.5">
                {ROLES.map((r) => {
                  const active = form.role === r.value
                  return (
                    <button
                      key={r.value} type="button" role="radio" aria-checked={active}
                      onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                        active
                          ? 'border-blue-400/60 bg-blue-400/10 text-white'
                          : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="flex items-center gap-2 mb-0.5">
                        <FontAwesomeIcon icon={faCircleCheck}
                          className={`text-xs transition-colors ${active ? 'text-blue-400' : 'text-white/15'}`} />
                        <span className="text-sm font-bold">{r.label}</span>
                      </span>
                      <span className="text-xs text-gray-500">{r.desc}</span>
                    </button>
                  )
                })}
              </div>
              {form.role === 'evaluator' && (
                <span className="flex items-start gap-2 text-xs text-amber-300/90 mt-1">
                  <FontAwesomeIcon icon={faClock} className="mt-0.5 flex-shrink-0" />
                  Professor accounts are reviewed by an admin before the first sign-in.
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 items-start">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" />
                  <input
                    id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} onBlur={handleBlur}
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    placeholder="At least 8 characters"
                    className={`${inputBase} pr-11 ${inputState('password')}`}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>

                {strength && !fieldErrors.password && (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
                    </div>
                    <span className={`text-xs font-semibold ${strength.text}`}>{strength.label}</span>
                  </div>
                )}
                {fieldErrors.password && (
                  <span id="password-error" className="text-red-400 text-xs">{fieldErrors.password}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm_password" className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Confirm password
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" />
                  <input
                    id="confirm_password" name="confirm_password"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm_password} onChange={handleChange} onBlur={handleBlur}
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.confirm_password}
                    aria-describedby={fieldErrors.confirm_password ? 'confirm_password-error' : undefined}
                    placeholder="Type it once more"
                    className={`${inputBase} pr-20 ${
                      fieldErrors.confirm_password
                        ? 'border-rose-500/50 focus:border-rose-400'
                        : matches
                          ? 'border-emerald-500/50 bg-emerald-500/[0.06]'
                          : 'border-white/10 hover:border-white/20 focus:border-blue-400/60 focus:bg-blue-400/[0.06]'
                    }`}
                  />
                  {matches && (
                    <FontAwesomeIcon icon={faCircleCheck}
                      className="absolute right-11 top-1/2 -translate-y-1/2 text-emerald-400 text-sm pointer-events-none" />
                  )}
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <span id="confirm_password-error" className="text-red-400 text-xs">{fieldErrors.confirm_password}</span>
                )}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="group relative overflow-hidden bg-blue-400 hover:bg-blue-300 text-black font-bold py-3 rounded-xl text-sm mt-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!loading && (
                <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                  style={{ animation: 'shimmer 3.2s ease-in-out infinite' }} />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-gray-600 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {SOCIAL_PROVIDERS.map((p) => (
              <a key={p.key} href={p.href} aria-label={`Continue with ${p.label}`}
                className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white py-3 rounded-xl text-sm font-semibold transition-all">
                <FontAwesomeIcon icon={p.icon} className="text-base" style={{ color: p.iconColor }} />
                <span className="hidden sm:inline lg:hidden xl:inline">{p.label}</span>
              </a>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          <div className="text-center mt-2">
            <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      <div className="photo-surface relative hidden lg:block overflow-hidden lg:order-1">
        {photoFailed ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#141d29] via-[#0d1218] to-[#0a0d10] flex items-center justify-center">
            <FontAwesomeIcon icon={faImage} className="text-white/10 text-3xl" />
          </div>
        ) : (
          <img src={SIDE_PHOTO} alt="" onError={() => setPhotoFailed(true)}
            className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-bl from-black/90 via-black/75 to-black/50" />
        <div className="absolute inset-y-0 right-0 w-px bg-white/8" />

        <div className="relative h-full flex flex-col justify-center px-14 xl:px-20">
          <h2 className="text-4xl xl:text-[3rem] font-bold text-white leading-[1.08] tracking-[-0.03em] mb-6">
            One account.<br />
            <span className="text-blue-400">Ready for your future.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed">
            Everything your professor sets feeds one profile — a portfolio and CV you can hand to an employer.
          </p>

          <div className="flex flex-wrap gap-2 max-w-md mb-10">
            {WHAT_YOU_DO.map((w, i) => (
              <span key={i}
                className="text-xs font-semibold text-gray-300 border border-white/10 bg-white/[0.04] px-3 py-1.5 rounded-full">
                {w}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {['Free for every student', 'Practise as often as you like', 'Assessments set by your lecturers'].map((p, i) => (
              <span key={i} className="flex items-center gap-3 text-sm text-gray-400">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400" />{p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage