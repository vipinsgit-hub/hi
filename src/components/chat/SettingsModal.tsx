import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import {
  ShieldCheck,
  Download,
  LogOut,
  Users,
  User,
  Radio,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, peerName }) => {
  const { user, profile, signOut, isMockMode, switchMockUser } = useAuth();
  const { isInstallable, installApp } = usePWA();

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      description="Private channel details and account management"
    >
      <div className="space-y-3.5 sm:space-y-4 text-sm max-h-[75dvh] overflow-y-auto pr-1">
        {/* User Identity Details */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-bg-secondary border border-border-subtle space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bg-panel border border-border-subtle flex items-center justify-center text-text-primary flex-shrink-0">
              <User className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {profile?.display_name || user?.user_metadata?.display_name || 'Authorized Member'}
                {(profile?.username || user?.user_metadata?.username) && (
                  <span className="text-text-muted font-normal ml-1">
                    @{profile?.username || user?.user_metadata?.username}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-text-muted truncate">Verified User</p>
            </div>
          </div>
        </div>

        {/* Security & Access Information */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-bg-secondary border border-border-subtle space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Private Two-Person Channel</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            This private conversation is shared exclusively with <strong className="text-text-primary">{peerName}</strong>. All requests enforce database Row-Level Security.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono pt-0.5">
            <Radio className="w-3 h-3 animate-pulse flex-shrink-0" />
            <span>Realtime synchronization active</span>
          </div>
        </div>

        {/* Development Preview Switcher (Only visible in Preview Mode) */}
        {isMockMode && switchMockUser && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-accent-subtle border border-accent/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Users className="w-3.5 h-3.5" />
              <span>Preview Switcher (Test Both Viewpoints)</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Currently acting as: <strong className="text-text-primary">{profile?.display_name}</strong>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant={profile?.id === 'usr_alex_001' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  switchMockUser('alex');
                  onClose();
                }}
              >
                Act as Alex
              </Button>
              <Button
                variant={profile?.id === 'usr_jordan_002' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  switchMockUser('jordan');
                  onClose();
                }}
              >
                Act as Jordan
              </Button>
            </div>
          </div>
        )}

        {/* PWA Install Button */}
        {isInstallable && (
          <Button
            variant="secondary"
            className="w-full justify-start text-xs"
            onClick={installApp}
            leftIcon={<Download className="w-4 h-4 text-accent" />}
          >
            Install HI App to Home Screen
          </Button>
        )}

        {/* Sign Out Action */}
        <div className="pt-2 border-t border-border-subtle">
          <Button
            variant="danger"
            className="w-full justify-center text-xs"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  );
};
