import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  isPeerOnline: boolean;
  peerLastSeen: string | null;
  isPeerTyping: boolean;
  setTyping: (isTyping: boolean) => void;
}

export function usePresence(roomId: string | null, peerUserId: string | null): PresenceState {
  const { user } = useAuth();
  const [isPeerOnline, setIsPeerOnline] = useState<boolean>(true);
  const [peerLastSeen, setPeerLastSeen] = useState<string | null>(null);
  const [isPeerTyping, setIsPeerTyping] = useState<boolean>(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set local user typing status and broadcast to room
  const setTyping = useCallback(
    (typing: boolean) => {
      if (!roomId || !user) return;

      if (!isSupabaseConfigured || !supabase) {
        // In mock mode, no-op or simulated response
        return;
      }

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user.id, isTyping: typing },
        });
      }
    },
    [roomId, user]
  );

  useEffect(() => {
    if (!roomId || !user) return;

    // Check browser online / offline state
    const handleNetworkOffline = () => setIsPeerOnline(false);
    const handleNetworkOnline = () => setIsPeerOnline(true);
    window.addEventListener('offline', handleNetworkOffline);
    window.addEventListener('online', handleNetworkOnline);

    if (!isSupabaseConfigured || !supabase) {
      // In development preview mode, keep the peer realistically active
      setIsPeerOnline(true);
      setPeerLastSeen(new Date().toISOString());

      return () => {
        window.removeEventListener('offline', handleNetworkOffline);
        window.removeEventListener('online', handleNetworkOnline);
      };
    }

    const channel = supabase.channel(`room:${roomId}:presence`, {
      config: {
        presence: { key: user.id },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        if (peerUserId && state[peerUserId]) {
          setIsPeerOnline(true);
          const presences = state[peerUserId] as any[];
          if (presences.length > 0 && presences[0].online_at) {
            setPeerLastSeen(presences[0].online_at);
          }
        } else {
          setIsPeerOnline(false);
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === peerUserId) {
          setIsPeerOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === peerUserId) {
          setIsPeerOnline(false);
          setPeerLastSeen(new Date().toISOString());
        }
      })
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.payload?.userId === peerUserId) {
          setIsPeerTyping(!!payload.payload.isTyping);

          // Auto-expire typing indicator after 3 seconds of silence
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          if (payload.payload.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsPeerTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: user.id,
          });
        }
      });

    return () => {
      window.removeEventListener('offline', handleNetworkOffline);
      window.removeEventListener('online', handleNetworkOnline);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, user, peerUserId]);

  return {
    isPeerOnline,
    peerLastSeen,
    isPeerTyping,
    setTyping,
  };
}
