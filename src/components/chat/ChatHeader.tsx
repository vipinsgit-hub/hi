import React, { useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { SettingsModal } from './SettingsModal';
import { formatLastSeen } from '@/utils/date';
import { Settings, Shield, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChatHeaderProps {
  peerName: string;
  peerUsername?: string;
  peerAvatarUrl?: string | null;
  isPeerOnline: boolean;
  peerLastSeen?: string | null;
  isPeerTyping?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  peerName,
  peerUsername,
  peerAvatarUrl,
  isPeerOnline,
  peerLastSeen,
  isPeerTyping,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isMockMode, switchMockUser, profile } = useAuth();

  const handleQuickSwitch = () => {
    if (!switchMockUser) return;
    const target = profile?.id === 'usr_alex_001' ? 'jordan' : 'alex';
    switchMockUser(target);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-bg-main/95 border-b border-border-subtle backdrop-blur-md pt-safe select-none">
      {/* Peer Profile Summary */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <Avatar
          name={peerName}
          avatarUrl={peerAvatarUrl}
          isOnline={isPeerOnline}
          showStatus={true}
          size="md"
        />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-sm font-semibold text-text-primary tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
              {peerName}
            </h2>
            {peerUsername && (
              <span className="text-[11px] text-text-muted font-normal truncate hidden xs:inline">
                @{peerUsername}
              </span>
            )}
            <Shield className="w-3 h-3 text-text-muted/60 flex-shrink-0" />
          </div>

          <p className="text-[11px] text-text-secondary truncate">
            {isPeerTyping ? (
              <span className="text-accent animate-pulse font-medium">typing...</span>
            ) : (
              formatLastSeen(peerLastSeen, isPeerOnline)
            )}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Quick User Switcher for Dev Preview */}
        {isMockMode && switchMockUser && (
          <button
            onClick={handleQuickSwitch}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-bg-panel border border-border-subtle text-text-secondary hover:text-text-primary active:bg-bg-elevated transition-all touch-manipulation active:scale-95"
            title="Switch between Alex & Jordan to test real-time conversation"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch Person</span>
          </button>
        )}

        {/* Settings / Account Menu Trigger with comfortable touch target */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 sm:p-2 rounded-xl text-text-secondary hover:text-text-primary active:bg-bg-panel transition-colors touch-manipulation active:scale-95 flex items-center justify-center min-w-[38px] min-h-[38px]"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4 sm:w-4 sm:h-4" />
        </button>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        peerName={peerName}
      />
    </header>
  );
};
