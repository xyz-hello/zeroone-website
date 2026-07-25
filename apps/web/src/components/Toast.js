import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const toastDurationMs = 4200;

function Toast({ message, onClose, type = 'info' }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onClose, toastDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  const toneClass = 'border-slate-200 bg-white text-slate-900';
  const accentClass =
    type === 'error'
      ? 'text-rose-600'
      : type === 'success'
        ? 'text-emerald-600'
        : type === 'warning'
          ? 'text-amber-500'
          : 'text-blue-600';
  const timerClass =
    type === 'error'
      ? 'bg-rose-500'
      : type === 'success'
        ? 'bg-emerald-500'
        : type === 'warning'
          ? 'bg-amber-400'
          : 'bg-blue-500';

  return createPortal(
    <div className="fixed right-5 top-5 z-[210] w-[calc(100vw-2.5rem)] max-w-sm">
      <div className={`overflow-hidden rounded-lg border text-sm font-bold shadow-2xl shadow-slate-950/15 ${toneClass}`}>
        <div className="flex items-start gap-3 px-4 py-3">
          <span
            className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-current/10 ${accentClass}`}
            aria-hidden="true"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
          </span>
          <p className="min-w-0 flex-1 leading-6">{message}</p>
          <button
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            type="button"
            onClick={onClose}
            aria-label="Close notification"
          >
            x
          </button>
        </div>
        <div className="h-1.5 bg-slate-100" aria-hidden="true">
          <div
            className={`h-full origin-left ${timerClass}`}
            style={{
              animation: `toastTimer ${toastDurationMs}ms linear forwards`
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Toast;
