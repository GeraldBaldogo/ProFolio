import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGavel, faCheck, faPen, faSpinner, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import api from '../services/api'

/*
 * The professor's final word on an AI-scored submission.
 *
 * The AI's score is a recommendation. Here the professor who set the test
 * either confirms it or adjusts it with a reason; their decision becomes the
 * score used everywhere (results, CV, titles). The system's original score
 * and the reason stay on record — shown below the decision.
 */

const when = (iso) => new Date(iso).toLocaleString('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})

export default function FacultyReviewPanel({ result, onReviewed }) {
  const review = result?.metadata?.review || null
  const systemScore = review?.system_score ?? result?.score
  const [editing, setEditing] = useState(false)
  const [score, setScore] = useState(String(result?.score ?? ''))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async (body) => {
    setBusy(true)
    setError('')
    try {
      const res = await api.patch(`/tests/results/${result.id}/review`, body)
      onReviewed?.(res.data.data)
      setEditing(false)
      setNote('')
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn\u2019t save your review.')
    } finally {
      setBusy(false)
    }
  }

  const n = Number(score)
  const validScore = score !== '' && Number.isInteger(n) && n >= 0 && n <= 100
  const canSave = validScore && note.trim().length >= 5 && !busy

  return (
    <div className="border border-amber-500/25 bg-amber-500/[0.05] rounded-2xl p-4">
      <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faGavel} /> Your review
      </p>

      {/* Current state */}
      {review ? (
        <div className="mb-3">
          <p className="text-white text-sm">
            {review.status === 'adjusted' ? (
              <>You changed the score from <span className="font-mono">{review.system_score}</span> to{' '}
                <span className="font-mono font-bold">{review.final_score}</span>.</>
            ) : (
              <>You confirmed the score of <span className="font-mono font-bold">{review.final_score}</span>.</>
            )}
          </p>
          {review.note && <p className="text-gray-400 text-xs mt-1 italic">&ldquo;{review.note}&rdquo;</p>}
          <p className="text-gray-600 text-[11px] mt-1">Reviewed {when(review.reviewed_at)}</p>
        </div>
      ) : (
        <p className="text-gray-400 text-xs leading-relaxed mb-3">
          The score of <span className="text-white font-mono font-semibold">{result.score}</span> was given by the system
          and hasn&apos;t been reviewed yet. Confirm it, or adjust it with a reason. Your decision is the score that
          counts — on the student&apos;s results and their CV.
        </p>
      )}

      {/* Actions */}
      {!editing ? (
        <div className="flex flex-wrap gap-2">
          {review?.status !== 'confirmed' && (
            <button type="button" disabled={busy} onClick={() => send({ action: 'confirm' })}
              className="flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
              <FontAwesomeIcon icon={busy ? faSpinner : faCheck} className={busy ? 'animate-spin' : ''} />
              {review ? 'Confirm current score' : `Confirm ${result.score}`}
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => { setScore(String(result.score)); setEditing(true) }}
            className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
            <FontAwesomeIcon icon={faPen} /> Adjust score
          </button>
          {review?.status === 'adjusted' && (
            <button type="button" disabled={busy}
              onClick={() => { setScore(String(systemScore)); setNote('Restored the system\u2019s original score.'); setEditing(true) }}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-semibold px-2 py-2 transition-colors disabled:opacity-50">
              <FontAwesomeIcon icon={faRotateLeft} /> Restore {systemScore}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label htmlFor={`score-${result.id}`} className="text-gray-400 text-xs">New score</label>
            <input
              id={`score-${result.id}`}
              type="number" min="0" max="100" step="1" inputMode="numeric"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-20 bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-lg px-2 py-1.5 text-white text-sm font-mono outline-none"
            />
            <span className="text-gray-600 text-xs">/ 100 · system gave {systemScore}</span>
          </div>
          <div>
            <label htmlFor={`note-${result.id}`} className="text-gray-400 text-xs block mb-1">
              Reason <span className="text-gray-600">(the student will see this)</span>
            </label>
            <textarea
              id={`note-${result.id}`}
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Handles the empty-list case the AI marked as missing."
              className="w-full bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!canSave} onClick={() => send({ action: 'adjust', score: n, note })}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
              <FontAwesomeIcon icon={busy ? faSpinner : faCheck} className={busy ? 'animate-spin' : ''} /> Save score
            </button>
            <button type="button" disabled={busy} onClick={() => { setEditing(false); setError('') }}
              className="text-gray-400 hover:text-white text-xs font-semibold px-3 py-2">
              Cancel
            </button>
          </div>
          {!validScore && score !== '' && <p className="text-rose-400 text-xs">Enter a whole number from 0 to 100.</p>}
        </div>
      )}

      {error && <p className="text-rose-400 text-xs mt-2">{error}</p>}
    </div>
  )
}