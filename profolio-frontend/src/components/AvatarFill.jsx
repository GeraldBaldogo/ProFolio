import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { cachedPhoto, ensurePhoto, subscribePhoto } from '../services/photo.service'

/*
 * What goes inside a student's round avatar: their profile photo when they
 * have one, otherwise the first letter of their name.
 *
 * Drop it inside the existing avatar box — the box keeps its size, corners
 * and gradient; the photo simply covers it. The photo is fetched once per
 * sign-in and shared, and changing it on the Profile or CV page updates every
 * avatar straight away.
 */
const AvatarFill = () => {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const [photo, setPhoto] = useState(() => (isStudent ? cachedPhoto(user.id) ?? null : null))

  useEffect(() => {
    if (!isStudent) return undefined
    let alive = true
    const unsubscribe = subscribePhoto((p) => { if (alive) setPhoto(p) })
    ensurePhoto(user.id).then((p) => { if (alive) setPhoto(p || null) })
    return () => { alive = false; unsubscribe() }
  }, [isStudent, user?.id])

  const initial = user?.full_name?.trim().charAt(0).toUpperCase() || '?'

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className="w-full h-full object-cover rounded-[inherit]"
        draggable={false}
      />
    )
  }
  return initial
}

export default AvatarFill