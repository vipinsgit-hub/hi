import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, Database } from 'lucide-react';

export const DevBanner: React.FC = () => {
  const { isMockMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isMockMode || dismissed) return null;

  return (
    <div className="bg-bg-panel/95 border-b border-border-subtle px-3 py-1.5 text-xs text-text-secondary flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-2 truncate">
        <span className="flex items-center gap-1 text-accent font-medium bg-accent-subtle px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase">
          <Database className="w-3 h-3" />
          Preview
        </span>
        <span className="truncate">
          Running with mock adapter. Connect your Supabase credentials in Stage 2 for live cloud messaging.
        </span>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-text-muted hover:text-text-primary rounded transition-colors flex-shrink-0 ml-2"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
