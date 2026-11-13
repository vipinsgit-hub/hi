import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, X, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChatMessageComposerProps {
  onSendMessage: (content: string) => Promise<void>;
  onEditSubmit?: (messageId: string, newContent: string) => Promise<void>;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatMessageComposer: React.FC<ChatMessageComposerProps> = ({
  onSendMessage,
  onEditSubmit,
  editingMessage,
  onCancelEdit,
  onTyping,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state if editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    } else {
      setContent('');
    }
  }, [editingMessage]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 160; // ~6 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustTextareaHeight();

    // Broadcast typing state
    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    try {
      if (editingMessage && onEditSubmit) {
        await onEditSubmit(editingMessage.id, trimmed);
        if (onCancelEdit) onCancelEdit();
      } else {
        await onSendMessage(trimmed);
      }
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (onTyping) onTyping(false);
    } finally {
      setIsSending(false);
      // Keep focus on desktop
      if (window.innerWidth >= 768) {
        textareaRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // ESC cancels editing mode
    if (e.key === 'Escape' && editingMessage && onCancelEdit) {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const isBlank = !content.trim();

  return (
    <div className="w-full bg-bg-main border-t border-border-subtle p-3 sm:p-4 pb-safe">
      {/* Editing State Notice */}
      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-bg-panel border border-border-subtle rounded-xl text-xs text-text-secondary animate-fade-in">
          <span className="truncate">
            Editing message: <span className="text-text-primary italic">"{editingMessage.content}"</span>
          </span>
          <button
            onClick={onCancelEdit}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Cancel editing"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Composer Input Box */}
      <div className="relative flex items-end gap-2 bg-bg-panel border border-border-subtle rounded-2xl p-1.5 px-3 focus-within:border-border-highlight focus-within:ring-1 focus-within:ring-accent/40 transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Send a private message..."
          rows={1}
          disabled={disabled || isSending}
          className="w-full max-h-40 py-2 bg-transparent text-sm text-text-primary placeholder:text-text-muted/60 resize-none focus:outline-none leading-relaxed select-text"
          style={{ minHeight: '2.5rem' }}
        />

        {/* Action Button: Send or Confirm Edit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBlank || isSending || disabled}
          aria-label={editingMessage ? 'Save changes' : 'Send message'}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 mb-1',
            isBlank || isSending || disabled
              ? 'bg-bg-elevated text-text-muted/40 cursor-not-allowed'
              : 'bg-text-primary text-bg-main hover:bg-white active:scale-95 shadow-sm'
          )}
        >
          {editingMessage ? (
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Keyboard Shortcut Hint for Desktop */}
      <div className="hidden sm:flex justify-between items-center mt-2 px-1 text-[11px] text-text-muted/60">
        <span>Press <kbd className="font-mono bg-bg-panel border border-border-subtle px-1 rounded">Enter</kbd> to send, <kbd className="font-mono bg-bg-panel border border-border-subtle px-1 rounded">Shift + Enter</kbd> for new line</span>
        <span>Row-Level Security Protected</span>
      </div>
    </div>
  );
};
