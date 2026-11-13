import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/features/chat/chat.service';
import type { ChatRoom, ChatMember } from '@/features/chat/chat.types';
import { useAuth } from './useAuth';

export function useChatRoom(roomId: string | null) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [peer, setPeer] = useState<ChatMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomDetails = useCallback(async () => {
    if (!roomId) {
      setRoom(null);
      setPeer(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const roomData = await chatService.getRoom(roomId);
      if (!roomData) {
        setError('Room not found or access denied.');
        setRoom(null);
        setPeer(null);
      } else {
        setRoom(roomData);
        // In a two-person chat, the peer is the member whose user_id != current user id
        const otherMember = roomData.members.find(m => m.user_id !== user?.id) || null;
        setPeer(otherMember);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load chat room';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, user?.id]);

  useEffect(() => {
    fetchRoomDetails();
  }, [fetchRoomDetails]);

  return {
    room,
    peer,
    isLoading,
    error,
    reloadRoom: fetchRoomDetails,
  };
}

