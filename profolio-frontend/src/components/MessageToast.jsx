import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

/**
 * The pop-up itself. Rendered once, next to the router, so it appears on
 * whatever page happens to be open.
 */
const MessageToast = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, dismissToast } = useNotifications()

  if (!toast) return null

  const go = () => {
    dismissToast()
    navigate(user?.role === 'evaluator' ? '/evaluator/messages' : '/student/messages')
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 max-w-[calc(100vw-3rem)]">
      <div className="border border-white/10 bg-[#0a0a18] rounded-2xl shadow-2xl overflow-hidden toast-in">
        <button
          onClick={go}
          className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faComments} className="text-blue-400 text-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{toast.name}</p>
            {/* Two lines at most. A long message shouldn't take over the screen. */}
            <p className="text-gray-400 text-xs leading-relaxed mt-0.5 overflow-hidden"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {toast.content}
            </p>
          </div>
        </button>

        <button
          onClick={dismissToast}
          aria-label="Dismiss"
          className="absolute top-3 right-3 w-6 h-6 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
        </button>
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-in { animation: toastIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .toast-in { animation: none; }
        }
      `}</style>
    </div>
  )
}

export default MessageToast