import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@/features/chat/chat.service';
import { useRealtimeMessages } from './useRealtimeMessages';
import { useAuth } from './useAuth';
import type { Message } from '@/features/chat/chat.types';

const PAGE_SIZE = 40;

export function useMessages(roomId: string | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to latest messages to avoid closure traps in realtime callbacks
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  // Initial load
  const loadInitialMessages = useCallback(async () => {
    if (!roomId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetched = await chatService.fetchMessages(roomId, PAGE_SIZE);
      setMessages(fetched);
      setHasMore(fetched.length >= PAGE_SIZE);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!roomId || isLoadingOlder || !hasMore || messagesRef.current.length === 0) {
      return;
    }

    setIsLoadingOlder(true);
    try {
      const oldestCreatedAt = messagesRef.current[0].created_at;
      const older = await chatService.fetchMessages(roomId, PAGE_SIZE, oldestCreatedAt);

      if (older.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const filteredNew = older.filter(m => !existingIds.has(m.id));
        return [...filteredNew, ...prev];
      });
    } catch {
      // Graceful failure for pagination
    } finally {
      setIsLoadingOlder(false);
    }
  }, [roomId, isLoadingOlder, hasMore]);

  // Handle incoming realtime message
  const handleRealtimeInsert = useCallback(
    (newMsg: Message) => {
      setMessages(prev => {
        // 1. Check if message already exists by id
        const existsById = prev.some(m => m.id === newMsg.id);
        if (existsById) {
          return prev;
        }

        // 2. Check if this resolves an optimistic message by tempId
        if (newMsg.tempId) {
          const optimisticIndex = prev.findIndex(m => m.tempId === newMsg.tempId);
          if (optimisticIndex !== -1) {
            const copy = [...prev];
            copy[optimisticIndex] = { ...newMsg, status: 'confirmed' };
            return copy;
          }
        }

        // 3. Fallback: match optimistic message from current user with matching content and sending status
        if (newMsg.sender_id === user?.id) {
          const pendingIdx = prev.findIndex(
            m => m.status === 'sending' && m.content === newMsg.content && m.sender_id === user?.id
          );
          if (pendingIdx !== -1) {
            const copy = [...prev];
            copy[pendingIdx] = { ...newMsg, status: 'confirmed' };
            return copy;
          }
        }

        // 4. Normal append: message from peer or another session
        return [...prev, { ...newMsg, status: 'confirmed' }];
      });
    },
    [user?.id]
  );

  // Handle message updates (e.g. edits)
  const handleRealtimeUpdate = useCallback((updatedMsg: Message) => {
    setMessages(prev =>
      prev.map(m => (m.id === updatedMsg.id ? { ...m, ...updatedMsg, status: 'confirmed' } : m))
    );
  }, []);

  // Handle message deletions (soft or hard deletes)
  const handleRealtimeDelete = useCallback((deletedMsgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== deletedMsgId));
  }, []);

  // Subscribe to realtime updates
  useRealtimeMessages(roomId, {
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeDelete,
  });

  // Optimistic message send
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !roomId || !user) return;

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Create optimistic message
      const optimisticMessage: Message = {
        id: tempId,
        room_id: roomId,
        sender_id: user.id,
        content: trimmed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        status: 'sending',
        tempId,
        sender: profile ?? undefined,
      };

      // Optimistically push to state
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        const confirmed = await chatService.sendMessage(
          { roomId, content: trimmed, tempId },
          user.id
        );

        // Reconcile optimistic message with server confirmation
        setMessages(prev =>
          prev.map(m => (m.tempId === tempId || m.id === tempId ? { ...confirmed, status: 'confirmed' } : m))
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to deliver message';
        // Mark as failed for retry
        setMessages(prev =>
          prev.map(m =>
            m.tempId === tempId || m.id === tempId
              ? { ...m, status: 'failed', errorMessage: errorMsg }
              : m
          )
        );
      }
    },
    [roomId, user, profile]
  );

  // Retry sending a previously failed message
  const retrySendMessage = useCallback(
    async (failedMsg: Message) => {
      if (!roomId || !user) return;

      setMessages(prev =>
        prev.map(m => (m.id === failedMsg.id ? { ...m, status: 'sending', errorMessage: undefined } : m))
      );

      try {
        const confirmed = await chatService.sendMessage(
          { roomId, content: failedMsg.content, tempId: failedMsg.tempId },
          user.id
        );

        setMessages(prev =>
          prev.map(m => (m.id === failedMsg.id ? { ...confirmed, status: 'confirmed' } : m))
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Retry failed';
        setMessages(prev =>
          prev.map(m => (m.id === failedMsg.id ? { ...m, status: 'failed', errorMessage: errorMsg } : m))
        );
      }
    },
    [roomId, user]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed || !user) return;

      const previousMessage = messagesRef.current.find(m => m.id === messageId);
      if (!previousMessage) return;

      // Optimistic edit
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, content: trimmed, edited_at: new Date().toISOString() }
            : m
        )
      );

      try {
        const confirmed = await chatService.editMessage(
          { messageId, content: trimmed },
          user.id
        );
        setMessages(prev => prev.map(m => (m.id === messageId ? confirmed : m)));
      } catch (err: unknown) {
        // Revert on failure
        setMessages(prev => prev.map(m => (m.id === messageId ? previousMessage : m)));
        throw err;
      }
    },
    [user]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user) return;

      const previousMessage = messagesRef.current.find(m => m.id === messageId);
      if (!previousMessage) return;

      // Optimistic removal
      setMessages(prev => prev.filter(m => m.id !== messageId));

      try {
        await chatService.deleteMessage({ messageId }, user.id);
      } catch (err: unknown) {
        // Revert on failure
        setMessages(prev => [...prev, previousMessage].sort((a, b) => a.created_at.localeCompare(b.created_at)));
        throw err;
      }
    },
    [user]
  );

  return {
    messages,
    isLoading,
    isLoadingOlder,
    hasMore,
    error,
    sendMessage,
    retrySendMessage,
    editMessage,
    deleteMessage,
    loadOlderMessages,
    refreshMessages: loadInitialMessages,
  };
}

