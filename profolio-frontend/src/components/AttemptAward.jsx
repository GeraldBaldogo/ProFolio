import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAward, faSeedling } from '@fortawesome/free-solid-svg-icons'

/**
 * What an attempt earned, shown on every assessment's result screen.
 *
 * A verified title comes only from a test a professor set, and depends on the
 * level that professor chose as well as the score. Practice shows the practice
 * rank instead — progress, not a credential — and says so, so the two are never
 * confused.
 */
const AttemptAward = ({ testId, result }) => {
  if (!result) return null

  if (testId) {
    return result.title_awarded ? (
      <div className="border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.12] to-amber-500/[0.03] rounded-2xl p-5 mb-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
          <FontAwesomeIcon icon={faAward} className="text-amber-400 text-xl" />
        </div>
        <p className="text-amber-300/80 text-[11px] font-semibold uppercase tracking-wider mb-1">Verified title earned</p>
        <p className="text-white font-black text-2xl mb-2">{result.title_awarded.label}</p>
        <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
          Awarded on a {result.title_awarded.test_level} level test set by your professor.
          Your highest title and the full history are on your Results page.
        </p>
      </div>
    ) : (
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 mb-4">
        <p className="text-gray-300 text-sm font-semibold mb-1">No title from this test</p>
        <p className="text-gray-500 text-xs leading-relaxed">
          A professor’s test awards the title for its level at 85 or higher, and the title one level
          below at 70 or higher. Any title you already hold is kept.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-4 mb-4 flex items-start gap-3">
      <FontAwesomeIcon icon={faSeedling} className="text-emerald-400 mt-0.5" />
      <div>
        <p className="text-gray-300 text-sm font-semibold mb-0.5">
          Practice rank: {result.practice_rank?.label || 'Not ranked yet'}
        </p>
        <p className="text-gray-500 text-xs leading-relaxed">
          Practice ranks show your progress. Verified titles come only from tests your professor assigns.
        </p>
      </div>
    </div>
  )
}

export default AttemptAward