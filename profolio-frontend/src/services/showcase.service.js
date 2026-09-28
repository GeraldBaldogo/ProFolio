import api from './api'

// The public portfolio page (/p/<slug>) and the student's switch for it.

const reason = (err, fallback) => new Error(err?.response?.data?.message || fallback)

export const getShowcaseSettings = async () => {
  try { return (await api.get('/student/showcase')).data.data }
  catch (err) { throw reason(err, 'Couldn\u2019t load your sharing settings.') }
}

// changes: { enabled?: boolean, show_email?: boolean }
export const updateShowcase = async (changes) => {
  try { return (await api.put('/student/showcase', changes)).data.data }
  catch (err) { throw reason(err, 'Couldn\u2019t update your sharing settings.') }
}

export const resetShowcaseLink = async () => {
  try { return (await api.post('/student/showcase/reset')).data.data }
  catch (err) { throw reason(err, 'Couldn\u2019t create a new link.') }
}

// No sign-in needed: this is what an employer's browser calls.
export const getPublicShowcase = async (slug) => {
  let data
  try { data = (await api.get(`/student/showcase/public/${encodeURIComponent(slug)}`)).data?.data }
  catch (err) {
    const e = reason(err, 'Couldn\u2019t load this portfolio.')
    e.status = err?.response?.status
    throw e
  }
  // A misconfigured deploy can answer with the site's own HTML instead of
  // JSON; show the error screen rather than crash on it.
  if (!data || typeof data !== 'object' || !data.name) throw new Error('Couldn\u2019t load this portfolio.')
  return data
}

export const showcaseUrl = (slug) => `${window.location.origin}/p/${slug}`