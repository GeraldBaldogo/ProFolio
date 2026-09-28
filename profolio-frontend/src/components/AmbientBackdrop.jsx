import { useEffect, useRef } from 'react'

/*
 * The app's background: a slow aurora of the accent colour and a field of
 * glitter that twinkles and drifts. Mounted once in App.jsx; the page decides
 * how much of it to show:
 *
 *   full  — landing, sign-in and register: the whole effect, plus a light
 *           that follows the pointer and sheds a few sparks.
 *   calm  — pages people work in: a dimmer aurora, a sparse field of slower
 *           glitter, nothing following the pointer.
 *
 * Any page can also freeze it (useBackdropStill) — the assessments do while
 * the timed part is running: colour stays, movement stops.
 *
 * It's fixed behind everything (z-index -1). While it's showing, <html> gets
 * the class fx-on, which makes each page's own solid background transparent
 * so the backdrop shows through (see index.css).
 *
 * Cost is kept small on purpose: the aurora is CSS transforms only, the
 * glitter is one canvas with a few dozen particles, the count drops on
 * phones, and drawing stops while the tab is hidden. With "reduce motion"
 * turned on, the glitter is drawn once and nothing moves.
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Accent + theme are attributes on <html>; read them fresh so the sparkles
// match whatever the visitor picked in the theme menu.
const readPalette = () => {
  const root = document.documentElement
  const css = getComputedStyle(root)
  const rgb = (css.getPropertyValue('--accent-rgb') || '96, 165, 250').trim()
  const light = root.getAttribute('data-theme') === 'light'
  return {
    light,
    rgb,
    colors: light
      ? [`rgb(${rgb})`, '#a855f7', '#f59e0b', '#0ea5e9', '#ec4899']
      : ['#ffffff', `rgb(${rgb})`, '#fde68a', '#c4b5fd', '#a5f3fc', '#f9a8d4'],
  }
}

const rand = (a, b) => a + Math.random() * (b - a)

const VARIANTS = {
  full: { density: 14000, min: 36, max: 110, starChance: 0.14, drift: 1, twinkle: 1, alphaDark: 0.85, alphaLight: 0.55, pointer: true },
  calm: { density: 32000, min: 16, max: 44, starChance: 0.08, drift: 0.5, twinkle: 0.6, alphaDark: 0.55, alphaLight: 0.4, pointer: false },
}

const makeParticle = (w, h, colors, cfg) => {
  const star = Math.random() < cfg.starChance
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: star ? rand(2.2, 4.2) : rand(0.5, 1.6),
    star,
    color: colors[Math.floor(Math.random() * colors.length)],
    phase: Math.random() * Math.PI * 2,
    speed: rand(0.6, 1.8) * cfg.twinkle,   // twinkle speed
    vy: -rand(0.04, 0.22) * cfg.drift,     // slow upward drift
    vx: rand(-0.05, 0.05) * cfg.drift,
    depth: rand(0.2, 1),            // parallax: near sparks move more
  }
}

// A four-point sparkle: two thin diamonds crossed, with a soft core.
const drawStar = (ctx, x, y, r, color, alpha) => {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = r * 3
  ctx.beginPath()
  ctx.moveTo(x, y - r * 2.4)
  ctx.quadraticCurveTo(x, y, x + r * 2.4, y)
  ctx.quadraticCurveTo(x, y, x, y + r * 2.4)
  ctx.quadraticCurveTo(x, y, x - r * 2.4, y)
  ctx.quadraticCurveTo(x, y, x, y - r * 2.4)
  ctx.fill()
  ctx.restore()
}

const drawDot = (ctx, x, y, r, color, alpha) => {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

export default function AmbientBackdrop({ variant = 'calm' }) {
  const canvasRef = useRef(null)
  const cfg = VARIANTS[variant] || null

  // Page backgrounds turn transparent only while there's something behind them
  useEffect(() => {
    if (!cfg) return
    document.documentElement.classList.add('fx-on')
    return () => document.documentElement.classList.remove('fx-on')
  }, [cfg])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !cfg) return
    const ctx = canvas.getContext('2d')
    const still = prefersReducedMotion()
    const finePointer = window.matchMedia?.('(pointer: fine)').matches

    let palette = readPalette()
    let w = 0, h = 0, dpr = 1
    let particles = []
    let trail = []
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false }
    let scrollShift = 0
    let frame = 0
    let raf = 0
    let running = true

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Density by area, capped (full: ~40 on a phone, up to ~110 on a big screen)
      const count = Math.round(Math.min(cfg.max, Math.max(cfg.min, (w * h) / cfg.density)))
      particles = Array.from({ length: count }, () => makeParticle(w, h, palette.colors, cfg))
      if (still) draw(0)
    }

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)

      // Light that follows the pointer
      if (pointer.active) {
        pointer.x += (pointer.tx - pointer.x) * 0.12
        pointer.y += (pointer.ty - pointer.y) * 0.12
        const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 260)
        g.addColorStop(0, `rgba(${palette.rgb}, ${palette.light ? 0.10 : 0.14})`)
        g.addColorStop(1, `rgba(${palette.rgb}, 0)`)
        ctx.globalAlpha = 1
        ctx.fillStyle = g
        ctx.fillRect(pointer.x - 260, pointer.y - 260, 520, 520)
      }

      const px = pointer.active ? (pointer.x / w - 0.5) : 0
      const py = pointer.active ? (pointer.y / h - 0.5) : 0

      for (const p of particles) {
        if (!still) {
          p.x += p.vx
          p.y += p.vy
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
          if (p.x < -10) p.x = w + 10
          if (p.x > w + 10) p.x = -10
        }
        // Parallax: near sparks shift a little with the pointer and scroll
        const x = p.x - px * 18 * p.depth
        const y = ((p.y - scrollShift * 0.08 * p.depth) % (h + 20) + (h + 20)) % (h + 20) - py * 18 * p.depth
        const tw = still ? 0.7 : 0.5 + 0.5 * Math.sin(t * 0.001 * p.speed + p.phase)
        const base = palette.light ? cfg.alphaLight : cfg.alphaDark
        if (p.star) drawStar(ctx, x, y, p.r * (0.7 + tw * 0.5), p.color, base * (0.25 + tw * 0.75))
        else drawDot(ctx, x, y, p.r, p.color, base * (0.15 + tw * 0.85))
      }

      // Sparks shed by the pointer; each fades and falls in under a second
      for (let i = trail.length - 1; i >= 0; i--) {
        const s = trail[i]
        s.life -= 1
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.03
        const a = Math.max(0, s.life / s.max)
        if (a <= 0) { trail.splice(i, 1); continue }
        drawStar(ctx, s.x, s.y, s.r * a, s.color, a * (palette.light ? 0.7 : 0.95))
      }
      ctx.globalAlpha = 1
    }

    const frozen = () => document.documentElement.hasAttribute('data-fx-still')

    const loop = (t) => {
      if (!running) return
      if (frozen()) { running = false; return }  // last frame stays on screen
      frame++
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e) => {
      pointer.tx = e.clientX
      pointer.ty = e.clientY
      if (!pointer.active) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true }
      // A spark every few frames of movement, never a flood
      if (!still && trail.length < 28 && frame % 3 === 0) {
        trail.push({
          x: e.clientX + rand(-6, 6), y: e.clientY + rand(-6, 6),
          vx: rand(-0.4, 0.4), vy: rand(-0.6, 0.1),
          r: rand(1.4, 2.8), life: 42, max: 42,
          color: palette.colors[Math.floor(Math.random() * palette.colors.length)],
        })
      }
    }
    const onLeave = () => { pointer.active = false }
    const onScroll = () => { scrollShift = window.scrollY }
    const resume = () => {
      if (still || running || document.hidden || frozen()) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const onVisibility = () => {
      if (still) return
      if (document.hidden) { running = false; cancelAnimationFrame(raf) }
      else resume()
    }

    // Recolour when the visitor changes accent or light/dark; stop or start
    // when a page freezes the backdrop
    const themeWatch = new MutationObserver((changes) => {
      if (changes.some((c) => c.attributeName !== 'data-fx-still')) {
        palette = readPalette()
        particles.forEach((p) => { p.color = palette.colors[Math.floor(Math.random() * palette.colors.length)] })
        if (still || !running) draw(performance.now())
      }
      if (frozen()) { running = false; cancelAnimationFrame(raf) }
      else resume()
    })
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent', 'data-fx-still'] })

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    if (cfg.pointer && finePointer && !still) {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerleave', onLeave)
    }
    if (still) running = false
    else if (frozen()) { running = false; draw(performance.now()) }
    else raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      themeWatch.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [cfg])

  if (!cfg) return null

  return (
    <div aria-hidden="true" className={`lp-backdrop is-${variant}`}>
      <div className="lp-aurora lp-aurora-1" />
      <div className="lp-aurora lp-aurora-2" />
      <div className="lp-aurora lp-aurora-3" />
      <div className="lp-aurora lp-aurora-4" />
      <div className="lp-veil" />
      <canvas ref={canvasRef} className="lp-glitter" />
    </div>
  )
}