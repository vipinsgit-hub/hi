import type { UserProfile } from '../auth/auth.types';

export type MessageDeliveryStatus = 'sending' | 'confirmed' | 'failed';

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  
  // Client-side optimistic tracking fields
  status?: MessageDeliveryStatus;
  tempId?: string;
  errorMessage?: string;
  
  // Joined sender profile
  sender?: UserProfile;
}

export interface ChatMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: UserProfile;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
  members: ChatMember[];
}

export interface SendMessagePayload {
  roomId: string;
  content: string;
  tempId?: string;
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
}

export interface UserPresence {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  onlineAt: string;
  isOnline: boolean;
}

export interface PaginationParams {
  limit?: number;
  beforeCreatedAt?: string;
}

