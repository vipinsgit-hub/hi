import React from 'react';

interface TypingIndicatorProps {
  peerName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ peerName = 'Friend' }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted select-none animate-fade-in">
      <div className="flex items-center gap-1 bg-bg-panel border border-border-subtle px-2.5 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" />
      </div>
      <span className="text-[11px] text-text-secondary">{peerName} is typing...</span>
    </div>
  );
};

