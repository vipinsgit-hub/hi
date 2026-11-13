import type { Message, ChatRoom, SendMessagePayload, EditMessagePayload, DeleteMessagePayload } from '@/features/chat/chat.types';
import { INITIAL_MOCK_MESSAGES, MOCK_ROOM, MOCK_USER_ALEX, MOCK_USER_JORDAN, MOCK_ROOM_ID } from './mockData';

const STORAGE_KEY_MESSAGES = 'hi_mock_room_messages';

type MessageEventCallback = (payload: { event: 'INSERT' | 'UPDATE' | 'DELETE'; message: Message }) => void;

class MockChatService {
  private messages: Message[] = [];
  private listeners: MessageEventCallback[] = [];

  constructor() {
    this.loadMessages();
  }

  private loadMessages() {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (saved) {
      try {
        this.messages = JSON.parse(saved);
        return;
      } catch {
        // fallback
      }
    }
    this.messages = [...INITIAL_MOCK_MESSAGES];
    this.saveMessages();
  }

  private saveMessages() {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(this.messages));
  }

  public subscribe(callback: MessageEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private emit(event: 'INSERT' | 'UPDATE' | 'DELETE', message: Message) {
    this.listeners.forEach(cb => cb({ event, message }));
  }

  public async getRoom(roomId: string): Promise<ChatRoom | null> {
    if (roomId === MOCK_ROOM_ID) {
      return MOCK_ROOM;
    }
    return null;
  }

  public async fetchMessages(roomId: string, limit = 50): Promise<Message[]> {
    await new Promise(r => setTimeout(r, 200));
    return this.messages
      .filter(m => m.room_id === roomId && !m.deleted_at)
      .slice(-limit);
  }

  public async sendMessage(payload: SendMessagePayload, senderId: string): Promise<Message> {
    await new Promise(r => setTimeout(r, 250));

    const senderProfile = senderId === MOCK_USER_JORDAN.id ? MOCK_USER_JORDAN : MOCK_USER_ALEX;

    const confirmedMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      room_id: payload.roomId,
      sender_id: senderId,
      content: payload.content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      status: 'confirmed',
      sender: senderProfile,
      tempId: payload.tempId,
    };

    this.messages.push(confirmedMessage);
    this.saveMessages();
    this.emit('INSERT', confirmedMessage);

    return confirmedMessage;
  }

  public async editMessage(payload: EditMessagePayload, senderId: string): Promise<Message> {
    await new Promise(r => setTimeout(r, 200));

    const index = this.messages.findIndex(m => m.id === payload.messageId);
    if (index === -1) {
      throw new Error('Message not found');
    }

    const target = this.messages[index];
    if (target.sender_id !== senderId) {
      throw new Error('Unauthorized: cannot edit another user’s message');
    }

    const updated: Message = {
      ...target,
      content: payload.content.trim(),
      edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.messages[index] = updated;
    this.saveMessages();
    this.emit('UPDATE', updated);

    return updated;
  }

  public async deleteMessage(payload: DeleteMessagePayload, senderId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 200));

    const index = this.messages.findIndex(m => m.id === payload.messageId);
    if (index === -1) {
      throw new Error('Message not found');
    }

    const target = this.messages[index];
    if (target.sender_id !== senderId) {
      throw new Error('Unauthorized: cannot delete another user’s message');
    }

    // Soft delete with timestamp
    const updated: Message = {
      ...target,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.messages[index] = updated;
    this.saveMessages();
    this.emit('DELETE', updated);
  }

  public resetMockData() {
    this.messages = [...INITIAL_MOCK_MESSAGES];
    this.saveMessages();
  }
}

export const mockChatService = new MockChatService();

