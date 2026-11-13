import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface EmptyConversationProps {
  peerName: string;
  onQuickHello?: () => void;
}

export const EmptyConversation: React.FC<EmptyConversationProps> = ({ peerName, onQuickHello }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center select-none">
      <div className="w-14 h-14 rounded-2xl bg-bg-panel border border-border-subtle flex items-center justify-center mb-5 text-text-secondary shadow-subtle">
        <Lock className="w-6 h-6 text-text-primary" />
      </div>

      <h3 className="text-lg font-semibold text-text-primary tracking-tight">
        Private Conversation
      </h3>

      <p className="text-xs text-text-secondary max-w-sm mt-2 leading-relaxed">
        Messages in this room are restricted strictly to you and <span className="text-text-primary font-medium">{peerName}</span> via PostgreSQL Row-Level Security.
      </p>

      {onQuickHello && (
        <div className="mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={onQuickHello}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
          >
            Say "HI"
          </Button>
        </div>
      )}
    </div>
  );
};

