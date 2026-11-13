import React, { useState } from 'react';
import type { Message } from '@/features/chat/chat.types';
import { formatMessageTime } from '@/utils/date';
import { cn } from '@/utils/cn';
import { CheckCheck, Clock, AlertCircle, RotateCcw, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: Message;
  isSentByMe: boolean;
  onRetry?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isSentByMe,
  onRetry,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';
  const isEdited = !!message.edited_at;

  return (
    <div
      className={cn(
        'group relative flex flex-col mb-2.5 max-w-[85%] sm:max-w-[75%]',
        isSentByMe ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div className="relative flex items-center gap-1.5">
        {/* Quick action menu trigger for sent messages */}
        {isSentByMe && !isSending && !isFailed && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="p-1 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
              title="Message options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 bottom-full mb-1 z-30 w-28 bg-bg-panel border border-border-subtle rounded-xl shadow-panel py-1 text-xs animate-fade-in"
                onMouseLeave={() => setShowMenu(false)}
              >
                {onEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(message);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-bg-elevated text-text-primary transition-colors"
                  >
                    <Pencil className="w-3 h-3 text-text-muted" />
                    <span>Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(message.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-danger-subtle text-danger transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={cn(
            'relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all break-words',
            isSentByMe
              ? 'bg-[#1F1F1F] text-text-primary border border-[#2E2E2E] shadow-bubble-sent rounded-tr-sm'
              : 'bg-bg-panel text-text-primary border border-border-subtle shadow-bubble-recv rounded-tl-sm',
            isFailed && 'border-danger/50 bg-danger/5',
            isSending && 'opacity-80'
          )}
        >
          {/* Message Text */}
          <div className="whitespace-pre-wrap select-text">{message.content}</div>

          {/* Metadata Footer: Timestamp + Status Indicators */}
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1 select-none text-[10px]',
              isSentByMe ? 'justify-end text-text-secondary/70' : 'justify-start text-text-secondary/70'
            )}
          >
            {isEdited && (
              <span className="italic text-text-muted text-[9px]">edited</span>
            )}

            <span>{formatMessageTime(message.created_at)}</span>

            {isSentByMe && (
              <span className="inline-flex items-center ml-0.5">
                {isSending ? (
                  <Clock className="w-2.5 h-2.5 text-text-muted animate-spin" />
                ) : isFailed ? (
                  <AlertCircle className="w-2.5 h-2.5 text-danger" />
                ) : (
                  <CheckCheck className="w-3 h-3 text-accent" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Failed Delivery Warning & Retry Button */}
      {isFailed && (
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-danger animate-fade-in">
          <span>Failed to send.</span>
          {onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="inline-flex items-center gap-1 underline hover:text-danger-hover font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
