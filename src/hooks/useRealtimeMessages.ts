import { useEffect } from 'react';
import { chatService } from '@/features/chat/chat.service';
import type { Message } from '@/features/chat/chat.types';

interface RealtimeHandlers {
  onInsert: (message: Message) => void;
  onUpdate: (message: Message) => void;
  onDelete: (messageId: string) => void;
}

export function useRealtimeMessages(roomId: string | null, handlers: RealtimeHandlers) {
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = chatService.subscribeToRoomMessages(roomId, {
      onInsert: handlers.onInsert,
      onUpdate: handlers.onUpdate,
      onDelete: handlers.onDelete,
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, handlers.onInsert, handlers.onUpdate, handlers.onDelete]);
}

