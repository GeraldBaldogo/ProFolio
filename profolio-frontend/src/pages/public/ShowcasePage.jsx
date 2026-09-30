import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot, faEnvelope, faGlobe, faCircleCheck, faSpinner, faCode, faBriefcase,
  faCertificate, faTrophy, faGraduationCap, faArrowUpRightFromSquare, faShieldHalved, faUserSlash,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons'
import { getPublicShowcase } from '../../services/showcase.service'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

/*
 * The public portfolio page at /p/<slug> — what an employer opens from a
 * student's résumé. No sign-in. The server decides what's public; this page
 * only lays it out.
 */

// The server already filters links; checked again here so nothing but a
// real web address ever becomes a clickable href.
const safe = (url) => (typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null)

const PROFICIENCY_STYLE = {
  Advanced: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Proficient: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Developing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Beginning: 'text-gray-400 bg-white/5 border-white/10',
}

const monthYear = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

// Frosted cards: solid enough that the glitter and aurora never pass behind
// text, translucent enough that the backdrop still shows at the edges.
// Own classes (not bg-white/…) so light mode gets its own values.
const glassStyles = `
  .sc-card {
    background: rgba(12, 14, 26, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px) saturate(140%);
    -webkit-backdrop-filter: blur(16px) saturate(140%);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 20px 40px -24px rgba(0, 0, 0, 0.6);
  }
  .sc-inner {
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.07);
    transition: border-color .25s, transform .25s;
  }
  @media (hover: hover) {
    .sc-inner:hover { border-color: rgba(var(--accent-rgb), 0.35); transform: translateY(-2px); }
  }
  /* The name card gets a soft glow of the accent colour across its top */
  .sc-hero {
    position: relative; overflow: hidden;
    background:
      radial-gradient(120% 140% at 0% 0%, rgba(var(--accent-rgb), 0.22), transparent 55%),
      radial-gradient(90% 120% at 100% 0%, rgba(168, 85, 247, 0.16), transparent 60%),
      rgba(12, 14, 26, 0.82);
  }
  [data-theme="light"] .sc-card {
    background: rgba(255, 255, 255, 0.86);
    border-color: rgba(15, 23, 42, 0.08);
    box-shadow: 0 20px 40px -28px rgba(15, 23, 42, 0.25);
  }
  [data-theme="light"] .sc-inner { background: rgba(15, 23, 42, 0.025); border-color: rgba(15, 23, 42, 0.08); }
  [data-theme="light"] .sc-hero {
    background:
      radial-gradient(120% 140% at 0% 0%, rgba(var(--accent-rgb), 0.16), transparent 55%),
      radial-gradient(90% 120% at 100% 0%, rgba(168, 85, 247, 0.10), transparent 60%),
      rgba(255, 255, 255, 0.9);
  }
`

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const Card = ({ icon, title, children, className = '' }) => (
  <section className={`sc-card rounded-2xl p-5 sm:p-6 ${className}`}>
    {title && (
      <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
        {icon && <FontAwesomeIcon icon={icon} className="text-blue-400 text-xs" />}
        {title}
      </h2>
    )}
    {children}
  </section>
)

const ExternalLink = ({ href, icon, children }) => {
  const url = safe(href)
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-xl transition-colors">
      <FontAwesomeIcon icon={icon} /> {children}
    </a>
  )
}

export default function ShowcasePage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | missing | error

  useEffect(() => {
    let alive = true
    setStatus('loading')
    getPublicShowcase(slug)
      .then((d) => { if (alive) { setData(d); setStatus('ready') } })
      .catch((e) => { if (alive) setStatus(e.status === 404 ? 'missing' : 'error') })
    return () => { alive = false }
  }, [slug])

  useEffect(() => {
    const previous = document.title
    if (data?.name) document.title = `${data.name} — Portfolio · ProFolio`
    return () => { document.title = previous }
  }, [data])

  const TopBar = (
    <header className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="" className="w-7 h-7 object-contain" />
        <span className="text-white font-black tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
      </Link>
      <Link to="/register" className="ml-auto text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition-colors">
        Build your own
      </Link>
    </header>
  )

  if (status !== 'ready') {
    return (
      <div className="min-h-screen bg-[#060612] font-sans flex flex-col">
        {TopBar}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-16">
          {status === 'loading' ? (
            <FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faUserSlash} className="text-gray-500 text-xl" />
              </div>
              <h1 className="text-white font-bold text-lg mb-2">
                {status === 'missing' ? 'This portfolio isn\u2019t available' : 'Couldn\u2019t load this portfolio'}
              </h1>
              <p className="text-gray-500 text-sm max-w-sm">
                {status === 'missing'
                  ? 'The link may be old, or its owner has turned sharing off. Ask them for a new link.'
                  : 'Please check your connection and try again.'}
              </p>
            </>
          )}
        </main>
      </div>
    )
  }

  const d = data
  const edu = d.education

  return (
    <div className="min-h-screen bg-[#060612] font-sans">
      <style>{glassStyles}</style>
      {TopBar}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 flex flex-col gap-4 sm:gap-5">

        {/* ── Who ── */}
        <section className="sc-card sc-hero rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row gap-5 sm:gap-7 sm:items-center">
          {d.photo ? (
            <img src={d.photo} alt={d.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover flex-shrink-0 border border-white/10" />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex-shrink-0 bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-black">
              {initials(d.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-bold text-2xl sm:text-4xl tracking-tight break-words">{d.name}</h1>
            {d.title && <p className="text-blue-400 font-semibold text-sm sm:text-base mt-1">{d.title}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-gray-400 text-xs sm:text-sm">
              {d.location && <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faLocationDot} className="text-[11px]" />{d.location}</span>}
              {edu?.school && <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={faGraduationCap} className="text-[11px]" />{edu.school}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {d.email && (
                <a href={`mailto:${d.email}`}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-colors">
                  <FontAwesomeIcon icon={faEnvelope} /> Email {d.name.split(' ')[0]}
                </a>
              )}
              <ExternalLink href={d.links?.github} icon={faGithub}>GitHub</ExternalLink>
              <ExternalLink href={d.links?.linkedin} icon={faLinkedin}>LinkedIn</ExternalLink>
              <ExternalLink href={d.links?.website} icon={faGlobe}>Website</ExternalLink>
            </div>
          </div>
        </section>

        {d.about && (
          <Card title="About">
            <p className="text-gray-300 text-sm sm:text-[15px] leading-relaxed">{d.about}</p>
          </Card>
        )}

        {/* ── Verified performance: the part no ordinary portfolio can show ── */}
        {(d.verified_performance?.length > 0 || d.verified_titles?.length > 0) && (
          <Card icon={faShieldHalved} title="Verified performance">
            <p className="text-gray-500 text-xs -mt-2 mb-4">
              Measured in timed, camera-proctored tests set by faculty — not self-reported.
            </p>
            {d.verified_titles?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {d.verified_titles.map((t) => (
                  <span key={`${t.label}-${t.area}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" /> {t.label}{t.area ? ` · ${t.area}` : ''}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-col divide-y divide-white/5">
              {d.verified_performance.map((p) => (
                <div key={p.area} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 first:pt-0 last:pb-0">
                  <p className="text-white font-semibold text-sm sm:w-36 flex-shrink-0">{p.area}</p>
                  <p className="text-gray-400 text-xs sm:text-sm flex-1 min-w-0">{p.detail}</p>
                  {p.proficiency && (
                    <span className={`self-start sm:self-auto text-xs font-semibold border px-2.5 py-1 rounded-full ${PROFICIENCY_STYLE[p.proficiency] || PROFICIENCY_STYLE.Beginning}`}>
                      {p.proficiency}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-[11px] mt-4">
              Proficiency: Advanced 85+ · Proficient 70–84 · Developing 55–69 · Beginning below 55 ·{' '}
              <Link to="/scoring" className="text-gray-400 hover:text-white underline underline-offset-2">how scoring works</Link>
            </p>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-5 items-start">
          {/* ── Left: projects and experience ── */}
          <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5">
            {d.projects?.length > 0 && (
              <Card icon={faCode} title="Projects">
                <div className="grid sm:grid-cols-2 gap-3">
                  {d.projects.map((p, i) => (
                    <div key={i} className="sc-inner rounded-xl p-4 flex flex-col">
                      <p className="text-white font-semibold text-sm">{p.title}</p>
                      {p.description && <p className="text-gray-400 text-xs mt-1.5 leading-relaxed line-clamp-4">{p.description}</p>}
                      {p.tech_stack && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {p.tech_stack.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                            <span key={t} className="text-[11px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md">{t}</span>
                          ))}
                        </div>
                      )}
                      {(safe(p.github_url) || safe(p.live_url)) && (
                        <div className="flex gap-3 mt-auto pt-3">
                          {safe(p.github_url) && (
                            <a href={safe(p.github_url)} target="_blank" rel="noopener noreferrer nofollow" className="text-gray-400 hover:text-white text-xs flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faGithub} /> Code
                            </a>
                          )}
                          {safe(p.live_url) && (
                            <a href={safe(p.live_url)} target="_blank" rel="noopener noreferrer nofollow" className="text-gray-400 hover:text-white text-xs flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px]" /> Live
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {d.experience?.length > 0 && (
              <Card icon={faBriefcase} title="Experience">
                <div className="flex flex-col gap-4">
                  {d.experience.map((e, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm">
                          {e.role}{e.organisation && <span className="text-gray-400 font-normal"> · {e.organisation}</span>}
                        </p>
                        {e.period && <p className="text-gray-500 text-xs mt-0.5">{e.period}</p>}
                        {e.summary && <p className="text-gray-400 text-xs sm:text-sm mt-1.5 leading-relaxed">{e.summary}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* ── Right: skills, education, certifications, achievements ── */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {d.skills?.length > 0 && (
              <Card title="Skills">
                <div className="flex flex-wrap gap-1.5">
                  {d.skills.map((s, i) => (
                    <span key={i} className="text-xs text-gray-200 bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg">{s.name}</span>
                  ))}
                </div>
                <p className="text-gray-600 text-[11px] mt-3">Listed by the student</p>
              </Card>
            )}

            {edu && (
              <Card icon={faGraduationCap} title="Education">
                <p className="text-white font-semibold text-sm">{edu.course}{edu.specialization ? ` — ${edu.specialization}` : ''}</p>
                {edu.school && <p className="text-gray-400 text-xs mt-1">{edu.school}</p>}
                {(edu.year_level || edu.expected_graduation) && (
                  <p className="text-gray-500 text-xs mt-1">
                    {[edu.year_level, edu.expected_graduation && `Expected ${edu.expected_graduation}`].filter(Boolean).join(' · ')}
                  </p>
                )}
                {edu.honors && <p className="text-amber-400 text-xs mt-2">{edu.honors}</p>}
              </Card>
            )}

            {d.certifications?.length > 0 && (
              <Card icon={faCertificate} title="Certifications">
                <div className="flex flex-col gap-3">
                  {d.certifications.map((c, i) => (
                    <div key={i}>
                      <p className="text-white text-sm font-medium">
                        {safe(c.credential_url)
                          ? <a href={safe(c.credential_url)} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-blue-400 transition-colors">{c.title} <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px] ml-0.5" /></a>
                          : c.title}
                      </p>
                      <p className="text-gray-500 text-xs">{[c.issuer, monthYear(c.issued_date)].filter(Boolean).join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {d.achievements?.length > 0 && (
              <Card icon={faTrophy} title="Achievements">
                <div className="flex flex-col gap-3">
                  {d.achievements.map((a, i) => (
                    <div key={i}>
                      <p className="text-white text-sm font-medium">{a.title}</p>
                      <p className="text-gray-500 text-xs">{[a.category, monthYear(a.achieved_date)].filter(Boolean).join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <footer className="text-center text-gray-600 text-xs pt-4">
          Built with <Link to="/" className="text-gray-400 hover:text-white">ProFolio</Link>
          {d.updated_at && <> · verified results as of {monthYear(d.updated_at)}</>}
        </footer>
      </main>
    </div>
  )
}