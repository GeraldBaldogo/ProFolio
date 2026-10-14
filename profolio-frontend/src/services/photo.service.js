import api from './api'

// The server stores the photo as a data URL and rejects anything over ~95k
// characters. A 2x2 on paper needs roughly 400px, so shrink and re-encode here
// until it fits — a phone photo goes from several MB to about 30–60 KB.
const MAX_CHARS = 90 * 1024

export const readPhoto = (file) => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith('image/')) {
    reject(new Error('Please choose an image file (JPG or PNG).'))
    return
  }
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const side = Math.min(img.width, img.height)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    for (const [px, quality] of [[420, 0.85], [360, 0.8], [300, 0.75], [240, 0.7]]) {
      const out = Math.min(px, side)
      canvas.width = out
      canvas.height = out
      ctx.fillStyle = '#fff' // transparent PNGs get a white background, not black
      ctx.fillRect(0, 0, out, out)
      // Centre-crop to a square
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out)
      const data = canvas.toDataURL('image/jpeg', quality)
      if (data.length <= MAX_CHARS) { resolve(data); return }
    }
    reject(new Error('That image couldn\u2019t be made small enough. Try a different photo.'))
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn\u2019t an image we can read.')) }
  img.src = url
})

// ── The signed-in student's photo, shared by every avatar on screen ─────────
// Fetched once per sign-in and kept here, so the sidebar, the top bar and the
// profile page all show the same picture, and an upload or removal anywhere
// updates all of them at once.
const store = { userId: null, photo: null, loaded: false, loading: null }
const listeners = new Set()

const publish = (userId, photo) => {
  store.userId = userId
  store.photo = photo || null
  store.loaded = true
  listeners.forEach((fn) => fn(store.photo))
}

export const subscribePhoto = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// The cached photo if it belongs to this user; undefined if not loaded yet.
export const cachedPhoto = (userId) =>
  store.loaded && store.userId === userId ? store.photo : undefined

// Loads the photo once for this user; later calls reuse the same request.
export const ensurePhoto = (userId) => {
  if (cachedPhoto(userId) !== undefined) return Promise.resolve(store.photo)
  if (store.loading && store.userId === userId) return store.loading
  store.userId = userId
  store.loaded = false
  store.loading = getProfilePhoto()
    .then((photo) => { if (store.userId === userId) publish(userId, photo); return photo })
    .catch(() => null) // no photo is fine — the initial is shown instead
    .finally(() => { store.loading = null })
  return store.loading
}

const publishCurrent = (photo) => { if (store.userId) publish(store.userId, photo) }

export const getProfilePhoto = async () => {
  const res = await api.get('/student/profile')
  return res.data?.data?.profile_photo || null
}

export const uploadProfilePhoto = async (file) => {
  const photo = await readPhoto(file)
  try {
    await api.put('/student/profile/photo', { photo })
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Couldn\u2019t save your photo.')
  }
  publishCurrent(photo)
  return photo
}

export const removeProfilePhoto = async () => {
  try {
    await api.delete('/student/profile/photo')
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Couldn\u2019t remove your photo.')
  }
  publishCurrent(null)
}