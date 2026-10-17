import { ArrowLeft } from 'lucide-react'

/*
 * The one Back button used across ProFolio: a bordered button with a Lucide
 * arrow that nudges left on hover. Same look on the assessments, the public
 * pages and the professor's submissions page.
 *
 *   <BackButton onClick={goBack} />
 *   <BackButton onClick={goBack} label="Back to assigned tests" />
 *   <BackButton onClick={goBack} iconOnlyOnPhone />   // label hidden below 640px
 */
const BackButton = ({ onClick, label = 'Back', iconOnlyOnPhone = false, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`group inline-flex flex-shrink-0 items-center gap-1.5 h-9 rounded-xl border border-white/8 bg-white/[0.03] text-gray-300 hover:text-white hover:bg-white/[0.06] text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${iconOnlyOnPhone ? 'w-9 justify-center sm:w-auto sm:pl-2.5 sm:pr-3.5' : 'pl-2.5 pr-3.5'
            } ${className}`}
    >
        <ArrowLeft size={16} strokeWidth={2.25} className="flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        <span className={iconOnlyOnPhone ? 'hidden sm:inline' : ''}>{label}</span>
    </button>
)

export default BackButton
