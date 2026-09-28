import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAward, faSeedling, faChevronDown, faSpinner, faUserTie, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { getTitles } from '../services/assessment.service'

/**
 * Titles, per assessment type.
 *
 * A verified title is earned only on a professor's test, and depends on the
 * test's level as well as the score — a perfect score on a first-year test
 * earns the first-year title. The highest one earned is shown, like a
 * certification; every test that contributed is listed in the history.
 *
 * The practice rank sits beside it, visibly secondary, so nobody mistakes
 * progress through practice for a verified result.
 */

const TYPE_LABEL = {
  programming: 'Coding',
  bugfix: 'Bug fixing',
  sql: 'SQL',
  flowchart: 'Flowchart',
  communication: 'Communication',
}
const LEVEL_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const LEVEL_CHIP = {
  easy: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10',
  medium: 'text-amber-300 border-amber-500/25 bg-amber-500/10',
  hard: 'text-rose-300 border-rose-500/25 bg-rose-500/10',
}

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const TypeTitles = ({ type, data, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  const best = data.verified
  const bestTier = best ? best.tier : -1

  return (
    <div className="border border-white/8 bg-white/[0.02] rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Verified title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            best ? 'bg-amber-500/15' : 'bg-white/5'
          }`}>
            <FontAwesomeIcon icon={faAward} className={best ? 'text-amber-400 text-lg' : 'text-gray-600 text-lg'} />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">{TYPE_LABEL[type]}</p>
            <p className={`font-black text-lg leading-tight ${best ? 'text-white' : 'text-gray-600'}`}>
              {best ? best.title : 'No verified title yet'}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {best
                ? <>From <span className="text-gray-300">{best.test_title}</span>{best.professor_name ? <> · {best.professor_name}</> : null} · {fmtDate(best.awarded_at)}</>
                : 'Earned only on tests your professor assigns.'}
            </p>
          </div>
        </div>

        {/* Practice rank — secondary, and labelled as practice */}
        <div className="sm:text-right flex-shrink-0">
          <p className="text-gray-600 text-[10px] uppercase tracking-wider">Practice rank</p>
          <p className="text-gray-300 text-xs font-semibold flex sm:justify-end items-center gap-1.5 mt-0.5">
            <FontAwesomeIcon icon={faSeedling} className="text-emerald-400 text-[10px]" />
            {data.practice_rank?.label || 'Not ranked yet'}
          </p>
        </div>
      </div>

      {/* The ladder: what each level of test can award */}
      {data.ladder?.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mt-4">
          {data.ladder.map((step) => {
            const earned = step.tier <= bestTier
            return (
              <div
                key={step.level}
                className={`rounded-lg border px-2 py-1.5 text-center ${
                  earned ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5'
                }`}
              >
                <p className={`text-[11px] font-semibold leading-tight ${earned ? 'text-amber-200' : 'text-gray-600'}`}>
                  {earned && <FontAwesomeIcon icon={faCheck} className="text-[9px] mr-1" />}
                  {step.label}
                </p>
                <p className="text-[9px] text-gray-600 mt-0.5">{LEVEL_LABEL[step.level]} test, 85+</p>
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      {data.history.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors"
          >
            <FontAwesomeIcon icon={faChevronDown} className={`text-[9px] transition-transform ${open ? 'rotate-180' : ''}`} />
            History · {data.history.length} test{data.history.length === 1 ? '' : 's'}
          </button>

          {open && (
            <div className="mt-2 flex flex-col gap-1.5">
              {data.history.map((h) => (
                <div key={h.result_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
                  <span className="text-gray-600 text-[11px] w-24 flex-shrink-0">{fmtDate(h.awarded_at)}</span>
                  <span className="text-gray-300 text-xs flex-1 min-w-[8rem] truncate">{h.test_title}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${LEVEL_CHIP[h.test_level] || LEVEL_CHIP.easy}`}>
                    {LEVEL_LABEL[h.test_level] || 'Easy'}
                  </span>
                  {h.professor_name && (
                    <span className="text-gray-600 text-[11px] flex items-center gap-1">
                      <FontAwesomeIcon icon={faUserTie} className="text-[9px]" /> {h.professor_name}
                    </span>
                  )}
                  <span className="text-gray-400 text-[11px] font-mono w-8 text-right">{h.score}</span>
                  <span className={`text-xs font-semibold w-full sm:w-auto sm:min-w-[9rem] sm:text-right ${h.title ? 'text-amber-300' : 'text-gray-600'}`}>
                    {h.title || 'No title'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TitlesCard = () => {
  const [titles, setTitles] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getTitles().then(setTitles).catch((e) => setError(e.message))
  }, [])

  if (error) return null
  if (!titles) {
    return (
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-6 flex items-center gap-2 text-gray-500 text-sm">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Loading your titles…
      </div>
    )
  }

  // Coding always shows. The others appear once there's something in them.
  const others = Object.keys(TYPE_LABEL).filter((t) =>
    t !== 'programming' && titles[t] && (titles[t].verified || titles[t].practice_rank || titles[t].history.length)
  )

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-white font-bold">Titles</p>
        <p className="text-gray-600 text-[11px]">Verified titles come only from professor tests</p>
      </div>
      <div className="flex flex-col gap-3">
        {titles.programming && <TypeTitles type="programming" data={titles.programming} defaultOpen />}
        {others.map((t) => <TypeTitles key={t} type={t} data={titles[t]} />)}
      </div>
    </div>
  )
}

export default TitlesCard