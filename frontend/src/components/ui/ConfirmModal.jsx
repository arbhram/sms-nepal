import { AlertTriangle } from 'lucide-react';

/**
 * Usage — keep a single piece of state per page:
 *
 *   const [confirmState, setConfirmState] = useState(null);
 *
 *   // trigger:
 *   setConfirmState({
 *     title: 'Delete student?',
 *     message: 'This cannot be undone.',
 *     onConfirm: async () => { setConfirmState(null); await doDelete(); },
 *   });
 *
 *   // in JSX:
 *   {confirmState && (
 *     <ConfirmModal {...confirmState} onCancel={() => setConfirmState(null)} />
 *   )}
 */
export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  danger = true,
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-rose-100' : 'bg-amber-100'}`}>
              <AlertTriangle size={20} className={danger ? 'text-rose-600' : 'text-amber-600'} />
            </div>
            <h3 className="font-display font-bold text-slate-900 text-lg leading-snug pt-1">{title}</h3>
          </div>
          {message && <p className="text-slate-500 text-sm mb-5 ml-[52px]">{message}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
            <button
              onClick={onConfirm}
              className={danger ? 'btn-danger' : 'btn-primary'}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
