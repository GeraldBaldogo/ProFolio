import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLock, faCircleCheck, faSpinner, faArrowRight, faTrophy, faSeedling,
} from '@fortawesome/free-solid-svg-icons'
import { faCircle } from '@fortawesome/free-regular-svg-icons'
import { getPracticeProgress } from '../services/assessment.service'

/**
 * The practice level picker, shared by every assessment page.
 *
 * Levels open in order: Medium once every Easy topic is passed, Hard once
 * every Medium topic is passed. The server enforces this — these buttons only
 * show it. Below the buttons, the chosen level's topics, which are passed, and
 * which one comes next.
 *
 * showPicker={false} gives a compact strip for pages without a picker
 * (flowchart), where the server chooses the next topic.
 *
 * It mounts fresh each time a page returns to setup, so progress is refetched
 * after every attempt without the page having to ask.
 */

const LEVELS = ['easy', 'medium', 'hard']
const NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const YEAR = { easy: '1st year', medium: '2nd year', hard: '3rd–4th year' }
const ACTIVE = {
  easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
}

// What was open last time this page was seen, kept for the whole session, so
// a newly opened level can be announced once rather than every visit.
const lastSeen = new Map()

const PracticeLevels = ({ type, value, onChange, showPicker = true }) => {
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const [justUnlocked, setJustUnlocked] = useState(null)

  useEffect(() => {
    let alive = true
    getPracticeProgress(type)
      .then((p) => {
        if (!alive) return
        setProgress(p)

        const before = lastSeen.get(type)
        const nowOpen = LEVELS.filter((l) => p.levels[l].unlocked)
        if (before) {
          const fresh = nowOpen.find((l) => !before.includes(l))
          if (fresh) {
            setJustUnlocked(fresh)
            onChange?.(fresh)
          }
        }
        lastSeen.set(type, nowOpen)

        // A level remembered from before may be closed for this student.
        if (value && !p.levels[value]?.unlocked) onChange?.('easy')
      })
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
    // Only on mount and when the assessment type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const level = showPicker
    ? value
    : (progress ? (LEVELS.find((l) => progress.levels[l].unlocked && !progress.levels[l].complete) || 'hard') : 'easy')
  const current = progress?.levels[level]
  const nextTopic = current?.topics.find((t) => !t.passed)
  const passScore = progress?.pass_score ?? 85
  const allDone = progress && LEVELS.every((l) => progress.levels[l].complete)

  return (
    <div>
      {justUnlocked && (
        <div className="border border-amber-500/25 bg-amber-500/[0.07] rounded-xl px-3.5 py-2.5 mb-3 flex items-center gap-2.5">
          <FontAwesomeIcon icon={faTrophy} className="text-amber-400 text-sm" />
          <p className="text-amber-200 text-xs font-semibold">
            {NAME[justUnlocked]} unlocked — every {NAME[LEVELS[LEVELS.indexOf(justUnlocked) - 1]]} topic passed.
          </p>
        </div>
      )}

      {/* Practice rank — progress only, never a verified title. */}
      {progress && (
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faSeedling} className="text-[11px] text-gray-500" />
          <span className="text-gray-500 text-[11px]">Practice rank:</span>
          <span className={`text-[11px] font-semibold ${progress.rank ? 'text-gray-200' : 'text-gray-600'}`}>
            {progress.rank?.label || 'Not ranked yet — pass your first topic'}
          </span>
        </div>
      )}

      {showPicker && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {LEVELS.map((l) => {
            const info = progress?.levels[l]
            const locked = progress ? !info.unlocked : l !== 'easy'
            const selected = value === l
            return (
              <button
                key={l}
                type="button"
                disabled={locked}
                onClick={() => onChange(l)}
                title={locked ? `Pass every ${NAME[LEVELS[LEVELS.indexOf(l) - 1]]} topic with ${passScore}+ to unlock` : undefined}
                className={`py-2.5 rounded-xl border transition-all flex flex-col items-center gap-0.5 ${
                  selected ? ACTIVE[l]
                    : locked ? 'border-white/5 text-gray-600 cursor-not-allowed'
                      : 'border-white/8 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  {locked && <FontAwesomeIcon icon={faLock} className="text-[10px]" />}
                  {!locked && info?.complete && <FontAwesomeIcon icon={faCircleCheck} className="text-[11px]" />}
                  {NAME[l]}
                </span>
                <span className={`text-[10px] ${selected ? 'opacity-80' : 'text-gray-600'}`}>
                  {progress ? `${info.passed}/${info.total} · ${YEAR[l]}` : YEAR[l]}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* The chosen level's topics */}
      <div className={showPicker ? 'mt-4' : ''}>
        {!progress && !error && (
          <p className="text-gray-600 text-xs flex items-center gap-2">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Loading your progress…
          </p>
        )}

        {error && (
          <p className="text-gray-600 text-xs">Couldn’t load your progress. You can still practise Easy.</p>
        )}

        {current && (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-gray-400 text-xs font-semibold">
                {showPicker ? `${NAME[level]} topics` : `Your level: ${NAME[level]}`}
              </p>
              <p className="text-gray-600 text-[11px]">Score {passScore}+ on each</p>
            </div>

            <div className="flex flex-col gap-1.5">
              {current.topics.map((t) => {
                const isNext = !t.passed && t.key === nextTopic?.key
                return (
                  <div
                    key={t.key}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${isNext ? 'bg-white/[0.04] border border-white/10' : 'border border-transparent'}`}
                  >
                    <FontAwesomeIcon
                      icon={t.passed ? faCircleCheck : faCircle}
                      className={`text-xs ${t.passed ? 'text-emerald-400' : 'text-gray-600'}`}
                    />
                    <span className={`text-xs flex-1 ${t.passed ? 'text-gray-300' : isNext ? 'text-white font-semibold' : 'text-gray-500'}`}>
                      {t.label}
                    </span>
                    {t.best_score !== null && (
                      <span className={`text-[11px] font-mono ${t.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {t.best_score}
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        next <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-gray-600 text-[11px] leading-relaxed mt-2.5">
              {allDone
                ? 'Every level complete. New challenges from any topic are still available for review.'
                : current.complete
                  ? level === 'hard'
                    ? 'Every Hard topic passed.'
                    : `All ${NAME[level]} topics passed — ${NAME[LEVELS[LEVELS.indexOf(level) + 1]]} is open.`
                  : `The next challenge will be on ${nextTopic?.label}. Only practice attempts count; assigned tests don\u2019t affect levels.`}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default PracticeLevels