import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface EmptyConversationProps {
  peerName: string;
  onQuickHello?: () => void;
}

export const EmptyConversation: React.FC<EmptyConversationProps> = ({ peerName, onQuickHello }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8 sm:py-16 px-4 sm:px-6 text-center select-none my-auto">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-bg-panel border border-border-subtle flex items-center justify-center mb-3 sm:mb-5 text-text-secondary shadow-subtle">
        <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-text-primary" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
        Private Conversation
      </h3>

      <p className="text-xs text-text-secondary max-w-xs sm:max-w-sm mt-1.5 sm:mt-2 leading-relaxed">
        Messages in this room are restricted strictly to you and <span className="text-text-primary font-medium">{peerName}</span> via PostgreSQL Row-Level Security.
      </p>

      {onQuickHello && (
        <div className="mt-4 sm:mt-6">
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
