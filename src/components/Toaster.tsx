import { dismissToast, useToast } from '../lib/toast';

export function Toaster() {
  const toast = useToast();
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="link-button mono"
              onClick={() => {
                toast.action?.();
                dismissToast();
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
