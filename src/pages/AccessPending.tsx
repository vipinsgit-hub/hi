import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { chatService } from '@/features/chat/chat.service';
import { sha256 } from '@/utils/crypto';
import { ShieldAlert, RefreshCw, LogOut, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

export const AccessPending: React.FC = () => {
  const { user, profile, checkRoomAccess, signOut } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [tokenInput, setTokenInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Auto-detect invitation token from URL query params
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && !tokenInput) {
      setTokenInput(urlToken.trim());
    }
  }, [searchParams, tokenInput]);

  const handleRefresh = async () => {
    setIsChecking(true);
    try {
      await checkRoomAccess();
    } finally {
      setIsChecking(false);
    }
  };

  const handleRedeemToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawToken = tokenInput.trim();
    if (!rawToken) {
      setRedeemError('Please enter a valid invitation token.');
      return;
    }

    setRedeemError(null);
    setIsRedeeming(true);

    try {
      const tokenHash = await sha256(rawToken);
      const res = await chatService.redeemInvitation(tokenHash);

      if (!res.success) {
        setRedeemError(res.error || 'Failed to redeem invitation. The token may be invalid, expired, or already used.');
        showToast('Invalid or expired invitation token', 'error');
        return;
      }

      showToast('Invitation redeemed successfully! Connecting to room...', 'success');
      await checkRoomAccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error redeeming token';
      setRedeemError(msg);
      showToast(msg, 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleInitializeRoom = async () => {
    setInitError(null);
    setIsInitializing(true);

    try {
      const res = await chatService.initializeRoom('HI');
      if (!res.success) {
        setInitError(res.error || 'Failed to initialize room.');
        showToast(res.error || 'Failed to initialize room', 'error');
        return;
      }

      showToast('Private room initialized! You are now the room owner.', 'success');
      await checkRoomAccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error initializing room';
      setInitError(msg);
      showToast(msg, 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <AuthLayout
      title="Access Restricted"
      subtitle="Private Room Authorization Required"
    >
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-bg-panel border border-border-subtle flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="p-4 rounded-xl bg-bg-panel border border-border-subtle text-xs text-text-secondary text-left space-y-2.5">
          <p className="text-text-primary font-medium flex items-center justify-between">
            <span>Signed in as:</span>
            <span className="font-semibold text-text-primary font-mono">
              @{profile?.username || user?.user_metadata?.username || 'user'}
            </span>
          </p>
          <p className="leading-relaxed">
            <strong>HI</strong> is a dedicated private messaging environment configured exclusively for two authorized participants.
          </p>
          <p className="leading-relaxed text-text-muted">
            Your account is authenticated, but your user ID has not been granted membership in the private chat room yet.
          </p>
        </div>

        {/* Option 1: Redeem Invitation Token */}
        <div className="p-4 rounded-xl bg-bg-secondary border border-border-subtle text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
            <KeyRound className="w-4 h-4 text-accent" />
            <span>Have an Invitation Token?</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Enter the 48-character secret invitation token you received from the room owner.
          </p>

          <form onSubmit={handleRedeemToken} className="space-y-2.5">
            <Input
              placeholder="Paste invitation token here"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              error={redeemError || undefined}
              className="font-mono text-xs"
              disabled={isRedeeming}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full"
              isLoading={isRedeeming}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Redeem Invitation & Join Room
            </Button>
          </form>
        </div>

        {/* Option 2: First-time Room Bootstrap (Owner) */}
        <div className="p-4 rounded-xl bg-bg-panel/60 border border-border-subtle text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
            <Sparkles className="w-3.5 h-3.5 text-text-muted" />
            <span>First time setup?</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            If you are the primary administrator configuring this instance and no chat room exists yet, initialize the room as owner.
          </p>
          {initError && (
            <p className="text-xs text-danger">{initError}</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={handleInitializeRoom}
            isLoading={isInitializing}
          >
            Initialize Private Room (Owner)
          </Button>
        </div>

        {/* Refresh & Sign Out */}
        <div className="space-y-2 pt-1">
          <Button
            variant="ghost"
            className="w-full text-xs"
            onClick={handleRefresh}
            isLoading={isChecking}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Check Access Status
          </Button>

          <Button
            variant="secondary"
            className="w-full text-xs"
            onClick={signOut}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-text-muted" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};
