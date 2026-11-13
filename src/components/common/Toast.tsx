import React from 'react';
import { useToast } from '@/hooks/useToast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-panel animate-slide-up text-sm backdrop-blur-md',
              isSuccess
                ? 'bg-bg-panel/95 border-emerald-500/30 text-emerald-400'
                : isError
                ? 'bg-bg-panel/95 border-danger/30 text-danger'
                : 'bg-bg-panel/95 border-border-subtle text-text-primary'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 flex-shrink-0 text-danger" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 flex-shrink-0 text-accent" />}
              <span className="truncate text-xs font-medium text-text-primary">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

