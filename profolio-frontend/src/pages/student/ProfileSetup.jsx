import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight, faArrowLeft, faCamera, faCheck, faSpinner, faTriangleExclamation,
  faUser, faGraduationCap, faCompass, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { uploadProfilePhoto } from '../../services/photo.service'
import { markProfileComplete } from '../../utils/profileSetup'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

/*
 * First-time setup — /student/setup.
 *
 * A new student lands here before anything else and fills in what the CV
 * needs: contact details and education. Everything is saved to the same
 * profile the Profile page edits, so after this the CV can be generated
 * straight away, and the Profile page is only for changing things later.
 */

const STEPS = [
  { key: 'you', title: 'About you', hint: 'How employers will reach you.', icon: faUser },
  { key: 'school', title: 'Education', hint: 'Where and what you’re studying.', icon: faGraduationCap },
  { key: 'goals', title: 'Goals & links', hint: 'Optional — you can add these later.', icon: faCompass },
]

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const COURSES = [
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Information Technology',
]

const EMPTY = {
  full_name: '', professional_title: '', phone: '', location: '',
  course: '', school: '', year_level: '', specialization: '', expected_graduation: '',
  academic_honors: '', bio: '', career_goal: '',
  linkedin_url: '', github_url: '', portfolio_url: '', work_experience: [],
}

const PHONE = /^[+()\d][\d\s()+-]{6,19}$/

// "github.com/juan" → "https://github.com/juan"; blank stays blank.
const withScheme = (v) => {
  const t = v.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

const validate = (step, f) => {
  const e = {}
  if (step === 0) {
    if (f.full_name.trim().length < 2) e.full_name = 'Enter your full name.'
    if (!f.phone.trim()) e.phone = 'Enter a phone number.'
    else if (!PHONE.test(f.phone.trim())) e.phone = 'That doesn’t look like a phone number.'
    if (!f.location.trim()) e.location = 'Enter your city or province.'
  }
  if (step === 1) {
    if (!f.school.trim()) e.school = 'Enter your school.'
    if (!f.course.trim()) e.course = 'Enter your course.'
    if (!f.year_level) e.year_level = 'Choose your year level.'
    if (!f.expected_graduation) e.expected_graduation = 'Choose when you expect to graduate.'
  }
  if (step === 2) {
    for (const k of ['github_url', 'linkedin_url', 'portfolio_url']) {
      const v = withScheme(f[k])
      if (v) { try { new URL(v) } catch { e[k] = 'That link doesn’t look right.' } }
    }
  }
  return e
}

// The open dropdown list is drawn by the browser, and on some (Chrome on
// Windows) it stays white even in dark mode while the options inherit white
// text. Fixed colors on each option keep the list readable in every theme.
const OPTION_STYLE = { color: '#0f172a', backgroundColor: '#ffffff' }

const inputBase = 'w-full bg-white/[0.04] rounded-xl px-4 py-3 text-white text-[15px] placeholder-gray-600 outline-none transition-all border'
const inputState = (err) => err
  ? 'border-rose-500/50 focus:border-rose-400'
  : 'border-white/10 hover:border-white/20 focus:border-blue-400/60 focus:bg-blue-400/[0.06]'

const Field = ({ id, label, optional, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
      {label}{optional && <span className="normal-case tracking-normal font-normal text-gray-600"> · optional</span>}
    </label>
    {children}
    {error && (
      <span className="flex items-center gap-1.5 text-xs text-rose-400">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" /> {error}
      </span>
    )}
  </div>
)

const ProfileSetup = () => {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()

  const [form, setForm] = useState(EMPTY)
  const [photo, setPhoto] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const photoInput = useRef(null)
  const headingRef = useRef(null)

  const thisYear = new Date().getFullYear()
  const baseYears = useMemo(() => Array.from({ length: 7 }, (_, i) => String(thisYear - 1 + i)), [thisYear])

  // Pre-fill with whatever is already saved (e.g. a returning student, or the
  // name that came from Google).
  useEffect(() => {
    let alive = true
    api.get('/student/profile')
      .then((res) => {
        if (!alive) return
        const p = res.data?.data || {}
        setPhoto(p.profile_photo || null)
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] ?? EMPTY[k]])),
          full_name: user?.full_name || '',
          school: p.school || 'Tomas Claudio Colleges',
          work_experience: Array.isArray(p.work_experience) ? p.work_experience : [],
        })
      })
      .catch(() => { if (alive) setForm((f) => ({ ...f, full_name: user?.full_name || '', school: 'Tomas Claudio Colleges' })) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user])

  // Move focus to the step heading so keyboard and screen-reader users follow along.
  useEffect(() => { headingRef.current?.focus() }, [step])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((v) => ({ ...v, [key]: undefined }))
    setError('')
  }

  // Stored as one string like "June 2027"; shown as two dropdowns.
  const gradMonth = MONTHS.find((m) => form.expected_graduation.toLowerCase().startsWith(m.toLowerCase())) || ''
  const gradYear = form.expected_graduation.match(/\d{4}/)?.[0] || ''
  // Keep an already-saved year in the list even if it's outside the usual range.
  const gradYears = gradYear && !baseYears.includes(gradYear) ? [gradYear, ...baseYears] : baseYears

  const setGrad = (month, year) => {
    setForm((f) => ({ ...f, expected_graduation: [month, year].filter(Boolean).join(' ') }))
    setErrors((v) => ({ ...v, expected_graduation: undefined }))
  }

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setError('')
    try {
      setPhoto(await uploadProfilePhoto(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const next = (e) => {
    e?.preventDefault()
    const found = validate(step, form)
    // Month picked without a year (or the reverse) isn't a full date yet.
    if (step === 1 && form.expected_graduation && !(gradMonth && gradYear)) {
      found.expected_graduation = 'Choose both the month and the year.'
    }
    if (Object.keys(found).length) {
      setErrors(found)
      return
    }
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish()
  }

  const finish = async () => {
    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        school: form.school.trim(),
        course: form.course.trim(),
        github_url: withScheme(form.github_url),
        linkedin_url: withScheme(form.linkedin_url),
        portfolio_url: withScheme(form.portfolio_url),
      }
      const res = await api.patch('/student/profile', body)
      const savedName = res.data?.data?.full_name || body.full_name
      if (savedName !== user?.full_name) updateUser({ full_name: savedName })
      markProfileComplete(user.id)
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 text-2xl" />
      </div>
    )
  }

  const current = STEPS[step]
  const initials = (form.full_name || user?.full_name || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <header className="max-w-2xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        <img src={logo} alt="" className="w-7 h-7 object-contain" />
        <span className="text-white font-black tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
        <button onClick={handleLogout}
          className="ml-auto flex items-center gap-2 text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
          <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" /> Sign out
        </button>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pb-16">
        <div className="pt-2 sm:pt-6 mb-6">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.15em] mb-2">Set up your profile</p>
          <h1 className="text-white font-bold text-2xl sm:text-3xl tracking-tight">
            Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-gray-400 text-sm sm:text-[15px] mt-2 leading-relaxed">
            Three quick steps. This goes straight onto your CV, so you won&apos;t have to type it again —
            you can change any of it later on your Profile page.
          </p>
        </div>

        {/* Progress */}
        <ol className="grid grid-cols-3 gap-2 mb-6" aria-label="Setup progress">
          {STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            return (
              <li key={s.key} aria-current={active ? 'step' : undefined}>
                <div className={`h-1.5 rounded-full transition-colors ${done || active ? 'bg-blue-400' : 'bg-white/10'}`} />
                <p className={`mt-2 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 ${active ? 'text-white' : done ? 'text-blue-300' : 'text-gray-600'}`}>
                  <FontAwesomeIcon icon={done ? faCheck : s.icon} className="text-[10px]" />
                  <span className="truncate">{s.title}</span>
                </p>
              </li>
            )
          })}
        </ol>

        <form onSubmit={next} noValidate
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7">
          <h2 ref={headingRef} tabIndex={-1} className="text-white font-bold text-lg outline-none">{current.title}</h2>
          <p className="text-gray-500 text-sm mb-5">{current.hint}</p>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" /> <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : initials}
                  {photoBusy && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faSpinner} spin />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <button type="button" onClick={() => photoInput.current?.click()} disabled={photoBusy}
                    className="inline-flex items-center gap-2 border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.07] text-gray-200 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                    <FontAwesomeIcon icon={faCamera} /> {photo ? 'Change photo' : 'Add photo'}
                  </button>
                  <p className="text-gray-600 text-xs mt-1.5">Optional · a 2x2 with a plain background works best.</p>
                  <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </div>
              </div>

              <Field id="full_name" label="Full name" error={errors.full_name}>
                <input id="full_name" className={`${inputBase} ${inputState(errors.full_name)}`} autoComplete="name"
                  placeholder="e.g. Juan Dela Cruz" value={form.full_name} onChange={set('full_name')} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="phone" label="Phone number" error={errors.phone}>
                  <input id="phone" className={`${inputBase} ${inputState(errors.phone)}`} autoComplete="tel" inputMode="tel"
                    placeholder="e.g. 0917 123 4567" value={form.phone} onChange={set('phone')} />
                </Field>
                <Field id="location" label="City / province" error={errors.location}>
                  <input id="location" className={`${inputBase} ${inputState(errors.location)}`} autoComplete="address-level2"
                    placeholder="e.g. Morong, Rizal" value={form.location} onChange={set('location')} />
                </Field>
              </div>
              <p className="text-gray-600 text-xs -mt-1">Your phone number appears on your CV only — never on your public showcase page.</p>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Field id="school" label="School" error={errors.school}>
                <input id="school" className={`${inputBase} ${inputState(errors.school)}`} autoComplete="organization"
                  placeholder="e.g. Tomas Claudio Colleges" value={form.school} onChange={set('school')} />
              </Field>
              <Field id="course" label="Course" error={errors.course}>
                <input id="course" list="course-options" className={`${inputBase} ${inputState(errors.course)}`}
                  placeholder="e.g. Bachelor of Science in Computer Science" value={form.course} onChange={set('course')} />
                <datalist id="course-options">
                  {COURSES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="year_level" label="Year level" error={errors.year_level}>
                  <select id="year_level" className={`${inputBase} ${inputState(errors.year_level)}`}
                    value={form.year_level} onChange={set('year_level')}>
                    <option value="" style={OPTION_STYLE}>Choose…</option>
                    {YEAR_LEVELS.map((y) => <option key={y} value={y} style={OPTION_STYLE}>{y}</option>)}
                  </select>
                </Field>
                <Field id="grad_month" label="Expected graduation" error={errors.expected_graduation}>
                  <div className="grid grid-cols-2 gap-2">
                    <select id="grad_month" aria-label="Graduation month"
                      className={`${inputBase} ${inputState(errors.expected_graduation)}`}
                      value={gradMonth} onChange={(e) => setGrad(e.target.value, gradYear)}>
                      <option value="" style={OPTION_STYLE}>Month</option>
                      {MONTHS.map((m) => <option key={m} value={m} style={OPTION_STYLE}>{m}</option>)}
                    </select>
                    <select aria-label="Graduation year"
                      className={`${inputBase} ${inputState(errors.expected_graduation)}`}
                      value={gradYear} onChange={(e) => setGrad(gradMonth, e.target.value)}>
                      <option value="" style={OPTION_STYLE}>Year</option>
                      {gradYears.map((y) => <option key={y} value={y} style={OPTION_STYLE}>{y}</option>)}
                    </select>
                  </div>
                </Field>
              </div>
              <Field id="specialization" label="Specialization" optional>
                <input id="specialization" className={`${inputBase} ${inputState()}`}
                  placeholder="e.g. Web Development" value={form.specialization} onChange={set('specialization')} />
              </Field>
              <Field id="academic_honors" label="Honors" optional>
                <input id="academic_honors" className={`${inputBase} ${inputState()}`}
                  placeholder="e.g. Dean's Lister, 1st Semester 2025" value={form.academic_honors} onChange={set('academic_honors')} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <Field id="professional_title" label="Headline" optional>
                <input id="professional_title" className={`${inputBase} ${inputState()}`}
                  placeholder="e.g. Aspiring Full-Stack Developer" value={form.professional_title} onChange={set('professional_title')} />
              </Field>
              <Field id="career_goal" label="Career goal" optional>
                <input id="career_goal" className={`${inputBase} ${inputState()}`}
                  placeholder="e.g. Junior web developer at a product company" value={form.career_goal} onChange={set('career_goal')} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="github_url" label="GitHub" optional error={errors.github_url}>
                  <input id="github_url" className={`${inputBase} ${inputState(errors.github_url)}`} inputMode="url"
                    placeholder="github.com/yourname" value={form.github_url} onChange={set('github_url')} />
                </Field>
                <Field id="linkedin_url" label="LinkedIn" optional error={errors.linkedin_url}>
                  <input id="linkedin_url" className={`${inputBase} ${inputState(errors.linkedin_url)}`} inputMode="url"
                    placeholder="linkedin.com/in/yourname" value={form.linkedin_url} onChange={set('linkedin_url')} />
                </Field>
              </div>
              <Field id="portfolio_url" label="Website" optional error={errors.portfolio_url}>
                <input id="portfolio_url" className={`${inputBase} ${inputState(errors.portfolio_url)}`} inputMode="url"
                  placeholder="yourname.dev" value={form.portfolio_url} onChange={set('portfolio_url')} />
              </Field>
              <Field id="bio" label="About you" optional>
                <textarea id="bio" rows={3} className={`${inputBase} ${inputState()} resize-none`}
                  placeholder="Two or three lines about what you enjoy building."
                  value={form.bio} onChange={set('bio')} />
              </Field>
            </div>
          )}

          <div className="flex items-center gap-3 mt-7">
            {step > 0 && (
              <button type="button" onClick={() => { setErrors({}); setStep(step - 1) }} disabled={saving}
                className="inline-flex items-center gap-2 border border-white/10 hover:border-white/25 text-gray-300 hover:text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back
              </button>
            )}
            <button type="submit" disabled={saving || photoBusy}
              className="ml-auto inline-flex items-center gap-2 bg-blue-400 hover:bg-blue-300 text-black px-5 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
              {saving ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Saving…</>
              ) : step < STEPS.length - 1 ? (
                <>Next <FontAwesomeIcon icon={faArrowRight} className="text-xs" /></>
              ) : (
                <>Finish <FontAwesomeIcon icon={faCheck} className="text-xs" /></>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-600 text-xs mt-4">Step {step + 1} of {STEPS.length}</p>
      </main>
    </div>
  )
}

export default ProfileSetup