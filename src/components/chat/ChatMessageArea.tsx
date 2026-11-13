import React, { useEffect, useRef } from 'react';
import type { Message } from '@/features/chat/chat.types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { DateSeparator } from './DateSeparator';
import { EmptyConversation } from './EmptyConversation';
import { formatDateSeparator, isSameDay } from '@/utils/date';
import { Loader2, ArrowDown } from 'lucide-react';

interface ChatMessageAreaProps {
  messages: Message[];
  currentUserId: string;
  peerName: string;
  isLoading: boolean;
  isLoadingOlder: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  onRetryMessage: (message: Message) => void;
  onEditMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onQuickHello?: () => void;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  messages,
  currentUserId,
  peerName,
  isLoading,
  isLoadingOlder,
  hasMore,
  onLoadOlder,
  onRetryMessage,
  onEditMessage,
  onDeleteMessage,
  onQuickHello,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const isNearBottomRef = useRef(true);

  // Check if user is scrolled near bottom
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 120;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // Scroll to bottom automatically on new messages if already near bottom or sent by me
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    const lastMsg = messages[messages.length - 1];
    const isSentByMe = lastMsg?.sender_id === currentUserId;

    if (isNewMessage && (isNearBottomRef.current || isSentByMe)) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentUserId]);

  // Initial scroll to bottom once messages finish loading
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading, messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3 select-none">
        <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
        <span className="text-xs">Decrypting private channel...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyConversation peerName={peerName} onQuickHello={onQuickHello} />;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-1 overscroll-contain select-none-touch"
    >
      {/* Pagination: Load older messages button / indicator */}
      {hasMore && (
        <div className="flex justify-center pb-4 pt-1">
          <button
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-panel border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-border-highlight transition-all disabled:opacity-50"
          >
            {isLoadingOlder ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 rotate-180" />
            )}
            <span>{isLoadingOlder ? 'Loading history...' : 'Load previous messages'}</span>
          </button>
        </div>
      )}

      {/* Render messages with grouping and date separators */}
      {messages.map((msg, index) => {
        const isSentByMe = msg.sender_id === currentUserId;
        const prevMsg = messages[index - 1];
        const showDateSeparator = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);

        return (
          <React.Fragment key={msg.id || msg.tempId || index}>
            {showDateSeparator && (
              <DateSeparator label={formatDateSeparator(msg.created_at)} />
            )}
            <ChatMessageBubble
              message={msg}
              isSentByMe={isSentByMe}
              onRetry={onRetryMessage}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
            />
          </React.Fragment>
        );
      })}

      {/* Anchor for automatic scroll */}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
};

