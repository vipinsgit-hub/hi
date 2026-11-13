import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/contexts/ToastContext';
import { chatService } from '@/features/chat/chat.service';
import { generateSecureToken, sha256 } from '@/utils/crypto';
import {
  ShieldCheck,
  Download,
  LogOut,
  Users,
  User,
  UserPlus,
  Copy,
  Check,
  Link as LinkIcon,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, peerName }) => {
  const { user, profile, signOut, isMockMode, switchMockUser, activeRoomId } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const { showToast } = useToast();

  const [inviteEmail, setInviteEmail] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    setInviteError(null);
    setIsGeneratingInvite(true);

    try {
      const rawToken = generateSecureToken(24); // 48-char hex string
      const tokenHash = await sha256(rawToken);
      const roomId = activeRoomId || 'room_hi_private_001';

      const res = await chatService.createInvitation(roomId, email, tokenHash, 7);
      if (!res.success) {
        setInviteError(res.error || 'Failed to create invitation.');
        showToast(res.error || 'Failed to create invitation', 'error');
        return;
      }

      const link = `${window.location.origin}/access-pending?token=${rawToken}`;
      setGeneratedLink(link);
      setInviteEmail('');
      showToast('Invitation link generated successfully', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating invitation';
      setInviteError(msg);
      showToast(msg, 'error');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setHasCopied(true);
      showToast('Invitation link copied to clipboard', 'info');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chat Settings"
      description="Security details and account management"
    >
      <div className="space-y-5 text-sm max-h-[75vh] overflow-y-auto pr-1">
        {/* User Identity Details */}
        <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-subtle space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bg-panel border border-border-subtle flex items-center justify-center text-text-primary">
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
        <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-subtle space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Room Authorization: Strict 2-Person</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            This private channel is shared exclusively with <strong className="text-text-primary">{peerName}</strong>. All requests enforce database Row-Level Security.
          </p>
        </div>

        {/* Partner Invitation Section */}
        <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-subtle space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
            <UserPlus className="w-4 h-4 text-accent" />
            <span>Invite Partner</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Generate a secure, single-use 7-day cryptographic invitation link for the second authorized member.
          </p>

          <form onSubmit={handleCreateInvite} className="space-y-2">
            <Input
              type="email"
              placeholder="Partner's email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              error={inviteError || undefined}
              className="text-xs"
              disabled={isGeneratingInvite}
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              isLoading={isGeneratingInvite}
              leftIcon={<LinkIcon className="w-3.5 h-3.5" />}
            >
              Generate Invitation Link
            </Button>
          </form>

          {generatedLink && (
            <div className="p-2.5 rounded-lg bg-bg-panel border border-border-subtle space-y-2 animate-fade-in">
              <p className="text-[11px] text-text-secondary font-medium">One-Time Invitation Link:</p>
              <p className="text-[11px] font-mono text-text-muted bg-bg-main p-2 rounded border border-border-subtle/50 break-all select-all">
                {generatedLink}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs"
                onClick={handleCopyLink}
                leftIcon={hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {hasCopied ? 'Link Copied!' : 'Copy Invitation Link'}
              </Button>
            </div>
          )}
        </div>

        {/* Development Preview Switcher (Only visible in Preview Mode) */}
        {isMockMode && switchMockUser && (
          <div className="p-3.5 rounded-xl bg-accent-subtle border border-accent/20 space-y-2">
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
