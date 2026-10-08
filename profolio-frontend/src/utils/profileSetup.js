import api from '../services/api'

// What a student must fill in before using ProFolio. These are the parts of
// the CV header and Education section that can't be made up by the AI — so
// once they're in, "Generate CV" works straight away.
export const REQUIRED_FIELDS = [
  { key: 'phone', label: 'Phone number' },
  { key: 'location', label: 'City / province' },
  { key: 'school', label: 'School' },
  { key: 'course', label: 'Course' },
  { key: 'year_level', label: 'Year level' },
  { key: 'expected_graduation', label: 'Expected graduation' },
]

const filled = (v) => typeof v === 'string' ? v.trim().length > 0 : v != null

export const missingFields = (profile, user) => {
  const missing = REQUIRED_FIELDS.filter((f) => !filled(profile?.[f.key]))
  if (!filled(user?.full_name)) missing.unshift({ key: 'full_name', label: 'Full name' })
  return missing
}

export const isProfileComplete = (profile, user) => missingFields(profile, user).length === 0

// Remembered for this tab, so the check runs once per sign-in and not on every
// page change. Cleared when the setup page saves.
let knownComplete = null // user id whose profile is known to be complete

export const markProfileComplete = (userId) => { knownComplete = userId }

export const checkProfileComplete = async (user) => {
  if (!user || user.role !== 'student') return true
  if (knownComplete === user.id) return true
  const res = await api.get('/student/profile')
  const ok = isProfileComplete(res.data?.data, user)
  if (ok) knownComplete = user.id
  return ok
}

// Where a user goes straight after signing in or registering.
export const homeFor = (user) => {
  if (user.role === 'student') return '/student/dashboard'
  if (user.role === 'evaluator') return '/evaluator/dashboard'
  if (user.role === 'admin') return '/admin/dashboard'
  return '/'
}

export const destinationAfterSignIn = async (user) => {
  if (user.role !== 'student') return homeFor(user)
  try {
    return (await checkProfileComplete(user)) ? homeFor(user) : '/student/setup'
  } catch {
    return homeFor(user) // can't check right now — the route guard will try again
  }
}