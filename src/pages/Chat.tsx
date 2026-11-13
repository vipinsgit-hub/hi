import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatRoom } from '@/hooks/useChatRoom';
import { useMessages } from '@/hooks/useMessages';
import { usePresence } from '@/hooks/usePresence';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessageArea } from '@/components/chat/ChatMessageArea';
import { ChatMessageComposer } from '@/components/chat/ChatMessageComposer';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useToast } from '@/hooks/useToast';

export const Chat: React.FC = () => {
  const { user, activeRoomId } = useAuth();
  const { peer, isLoading: isRoomLoading } = useChatRoom(activeRoomId);
  const { showToast } = useToast();

  const {
    messages,
    isLoading: isMessagesLoading,
    isLoadingOlder,
    hasMore,
    sendMessage,
    retrySendMessage,
    editMessage,
    deleteMessage,
    loadOlderMessages,
  } = useMessages(activeRoomId);

  const peerId = peer?.user_id ?? null;
  const peerName = peer?.profile?.display_name || 'Friend';
  const peerAvatarUrl = peer?.profile?.avatar_url || null;

  const { isPeerOnline, peerLastSeen, isPeerTyping, setTyping } = usePresence(
    activeRoomId,
    peerId
  );

  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(
    null
  );

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleEditSubmit = async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
      setEditingMessage(null);
      showToast('Message updated', 'success');
    } catch {
      showToast('Failed to update message', 'error');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      showToast('Message deleted', 'info');
    } catch {
      showToast('Failed to delete message', 'error');
    }
  };

  const handleQuickHello = async () => {
    await sendMessage('HI 👋');
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-main">
      {/* Header with peer status and settings */}
      <ChatHeader
        peerName={peerName}
        peerUsername={peer?.profile?.username}
        peerAvatarUrl={peerAvatarUrl}
        isPeerOnline={isPeerOnline}
        peerLastSeen={peerLastSeen}
        isPeerTyping={isPeerTyping}
      />

      {/* Message history viewport */}
      <ChatMessageArea
        messages={messages}
        currentUserId={user?.id || ''}
        peerName={peerName}
        isLoading={isRoomLoading || isMessagesLoading}
        isLoadingOlder={isLoadingOlder}
        hasMore={hasMore}
        onLoadOlder={loadOlderMessages}
        onRetryMessage={retrySendMessage}
        onEditMessage={msg => setEditingMessage({ id: msg.id, content: msg.content })}
        onDeleteMessage={handleDeleteMessage}
        onQuickHello={handleQuickHello}
      />

      {/* Typing indicator */}
      {isPeerTyping && <TypingIndicator peerName={peerName} />}

      {/* Message composer */}
      <ChatMessageComposer
        onSendMessage={handleSendMessage}
        onEditSubmit={handleEditSubmit}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onTyping={setTyping}
        disabled={isRoomLoading}
      />
    </div>
  );
};
