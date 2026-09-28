import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSpinner, faScaleBalanced, faShieldHalved, faBullseye, faRobot, faGaugeHigh, faArrowLeft,
  faKeyboard, faCode, faBug, faDatabase, faDiagramProject, faComments, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import api from '../../services/api'
import logo from '../../assets/ProFolio_-_Logo-removebg-preview.png'

/*
 * "How scoring works" — public, at /scoring.
 *
 * Everything on this page comes from GET /api/assessments/rubric, which is
 * served from backend utils/rubrics.js: the same file the AI graders are
 * given and the code that weights their answers. So the criteria and weights
 * here are exactly what's applied, not a description of them.
 */

const TYPE_ICON = {
  typing: faKeyboard, programming: faCode, bugfix: faBug,
  sql: faDatabase, flowchart: faDiagramProject, communication: faComments,
}

const BAND_STYLE = {
  Advanced: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Proficient: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Developing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Beginning: 'text-gray-400 bg-white/5 border-white/10',
}

// "85–100", "70–84", … from the list of minimums
const bandRange = (bands, i) => (i === 0 ? `${bands[i].min}–100` : `${bands[i].min}–${bands[i - 1].min - 1}`)

export default function ScoringPage() {
  const [rubric, setRubric] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const previous = document.title
    document.title = 'How scoring works · ProFolio'
    api.get('/assessments/rubric')
      .then((res) => {
        const data = res.data?.data
        if (!data?.types) throw new Error()
        setRubric(data)
      })
      .catch(() => setError('Couldn\u2019t load the scoring rules. Please try again.'))
    return () => { document.title = previous }
  }, [])

  return (
    <div className="min-h-screen bg-[#060612] font-sans">
      <header className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" className="w-7 h-7 object-contain" />
          <span className="text-white font-black tracking-tight">Pro<span className="text-blue-400">Folio</span></span>
        </Link>
        <button onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
          className="ml-auto flex items-center gap-2 text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="pt-4 sm:pt-8 pb-8 sm:pb-10 max-w-3xl">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.15em] mb-3">Standardised scoring</p>
          <h1 className="text-white font-bold text-3xl sm:text-5xl tracking-tight mb-4">How scoring works</h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Every assessment is scored against a fixed rubric. Where AI marks the work, it scores each
            criterion separately — the system, not the AI, applies the weights below — so the same answer
            is always weighted the same way, whoever submits it.
          </p>
        </div>

        {error && (
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 flex items-center gap-3 text-rose-300 text-sm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400" /> {error}
          </div>
        )}
        {!rubric && !error && (
          <div className="flex justify-center py-20"><FontAwesomeIcon icon={faSpinner} className="text-blue-400 text-3xl animate-spin" /></div>
        )}

        {rubric && (
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* ── One scale for everything ── */}
            <section className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 sm:p-6">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={faScaleBalanced} className="text-blue-400 text-sm" /> One proficiency scale
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mb-5">The same four bands for every assessment — and the ones printed on the CV.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {rubric.proficiency.map((b, i) => (
                  <div key={b.label} className="border border-white/8 bg-white/[0.02] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${BAND_STYLE[b.label]}`}>{b.label}</span>
                      <span className="text-white font-bold tabular-nums text-sm">{bandRange(rubric.proficiency, i)}</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{b.meaning}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── The rules around the score ── */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
              <section className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 sm:p-6">
                <h2 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-amber-400 text-sm" /> Integrity
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{rubric.integrity.rule}</p>
                <p className="text-gray-500 text-xs mt-3">
                  Score = rubric score − {rubric.integrity.per_violation} × flags (at most −{rubric.integrity.max_penalty}), never below 0.
                </p>
              </section>
              <section className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 sm:p-6">
                <h2 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faGaugeHigh} className="text-emerald-400 text-sm" /> Practice and graded tests
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Practice is unlimited. Scoring {rubric.practice_pass_score} or more on every topic of a level
                  unlocks the next level. Only tests set by your professor count as verified results on your CV.
                </p>
              </section>
            </div>

            {/* ── Each assessment ── */}
            {rubric.types.map((t) => (
              <section key={t.type} className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={TYPE_ICON[t.type] || faCode} className="text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-semibold text-lg">{t.label}</h2>
                    <p className="text-gray-400 text-xs sm:text-sm flex items-start gap-1.5 mt-0.5">
                      <FontAwesomeIcon icon={faBullseye} className="text-[11px] mt-1 flex-shrink-0" />
                      <span><span className="text-gray-500">Learning outcome:</span> {t.outcome}</span>
                    </p>
                    <p className="text-gray-500 text-xs flex items-start gap-1.5 mt-1">
                      <FontAwesomeIcon icon={faRobot} className="text-[11px] mt-0.5 flex-shrink-0" /> {t.method}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {t.criteria.map((c) => (
                    <div key={c.key} className="grid grid-cols-[1fr_auto] sm:grid-cols-[180px_1fr_52px] items-center gap-x-4 gap-y-1">
                      <p className="text-white text-sm font-medium">{c.label}</p>
                      <p className="text-white text-sm font-bold tabular-nums text-right sm:order-last">{c.weight}%</p>
                      <div className="col-span-2 sm:col-span-1">
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-1">
                          <div className="h-full rounded-full bg-blue-400" style={{ width: `${c.weight}%` }} />
                        </div>
                        <p className="text-gray-500 text-xs">{c.measures}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <p className="text-gray-600 text-xs text-center pt-2">
              These rules are read from the same file the system grades with, so this page always matches how your work is scored.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}