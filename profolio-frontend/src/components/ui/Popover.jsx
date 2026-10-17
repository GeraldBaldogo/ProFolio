import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/*
 * Shared plumbing for ProFolio's dropdowns and calendars.
 *
 * The panel is drawn in a portal on <body> with fixed positioning, so a card
 * with overflow:hidden (or a modal) can't clip it. It sits under its trigger,
 * flips above when there isn't room below, follows scrolling, and closes on
 * Escape, Tab-away or a click anywhere else.
 */
export function usePopover() {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const panelRef = useRef(null)

  const close = useCallback((refocus = false) => {
    setOpen(false)
    if (refocus) anchorRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (anchorRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  return { open, setOpen, close, anchorRef, panelRef }
}

const GAP = 6

export function PopoverPanel({ open, anchorRef, panelRef, width = 'anchor', minWidth = 0, children, className = '', onKeyDown, label }) {
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const a = anchorRef.current
    const p = panelRef.current
    if (!a || !p) return
    const r = a.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = width === 'anchor' ? Math.max(r.width, minWidth) : width
    const h = p.offsetHeight
    const below = vh - r.bottom - GAP
    const above = r.top - GAP
    const top = h <= below || below >= above ? r.bottom + GAP : Math.max(8, r.top - GAP - h)
    const left = Math.min(Math.max(8, r.left), Math.max(8, vw - w - 8))
    setPos({ top, left, width: Math.min(w, vw - 16) })
  }, [anchorRef, panelRef, width, minWidth])

  useLayoutEffect(() => {
    if (!open) { setPos(null); return undefined }
    place()
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  if (!open) return null
  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: pos?.width,
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 100,
      }}
      className={`bg-[#0a0a18] border border-white/10 rounded-xl shadow-2xl shadow-black/30 ${className}`}
    >
      {children}
    </div>,
    document.body,
  )
}
