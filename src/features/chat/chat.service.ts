import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mockChatService } from '@/lib/mock/mockChatService';
import type {
  Message,
  ChatRoom,
  SendMessagePayload,
  EditMessagePayload,
  DeleteMessagePayload,
} from './chat.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class ChatService {
  /**
   * Fetch chat room details including members and their profiles.
   */
  async getRoom(roomId: string): Promise<ChatRoom | null> {
    if (!isSupabaseConfigured || !supabase) {
      return mockChatService.getRoom(roomId);
    }

    try {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !room) {
        return null;
      }

      const { data: members, error: membersError } = await supabase
        .from('chat_members')
        .select(`
          id,
          room_id,
          user_id,
          role,
          joined_at,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .eq('room_id', roomId);

      if (membersError) {
        return {
          id: room.id,
          name: room.name,
          created_at: room.created_at,
          members: [],
        };
      }

      const mappedMembers = (members || []).map((m: any) => ({
        id: m.id,
        room_id: m.room_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        profile: m.profiles,
      }));

      return {
        id: room.id,
        name: room.name,
        created_at: room.created_at,
        members: mappedMembers,
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch messages for a specific room with optional chronological pagination.
   */
  async fetchMessages(roomId: string, limit = 50, beforeCreatedAt?: string): Promise<Message[]> {
    if (!isSupabaseConfigured || !supabase) {
      return mockChatService.fetchMessages(roomId, limit);
    }

    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          room_id,
          sender_id,
          content,
          created_at,
          updated_at,
          edited_at,
          deleted_at,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .eq('room_id', roomId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (beforeCreatedAt) {
        query = query.lt('created_at', beforeCreatedAt);
      }

      const { data, error } = await query;
      if (error || !data) {
        return [];
      }

      // Re-map joined profiles and reverse to chronological order
      const messages: Message[] = data
        .map((row: any) => ({
          id: row.id,
          room_id: row.room_id,
          sender_id: row.sender_id,
          content: row.content,
          created_at: row.created_at,
          updated_at: row.updated_at,
          edited_at: row.edited_at,
          deleted_at: row.deleted_at,
          status: 'confirmed' as const,
          sender: row.profiles,
        }))
        .reverse();

      return messages;
    } catch {
      return [];
    }
  }

  /**
   * Send a message to the specified room.
   */
  async sendMessage(payload: SendMessagePayload, senderId: string): Promise<Message> {
    if (!isSupabaseConfigured || !supabase) {
      return mockChatService.sendMessage(payload, senderId);
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: payload.roomId,
        sender_id: senderId,
        content: payload.content.trim(),
      })
      .select(`
        id,
        room_id,
        sender_id,
        content,
        created_at,
        updated_at,
        edited_at,
        deleted_at,
        profiles (
          id,
          username,
          display_name,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to send message');
    }

    return {
      id: (data as any).id,
      room_id: (data as any).room_id,
      sender_id: (data as any).sender_id,
      content: (data as any).content,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at,
      edited_at: (data as any).edited_at,
      deleted_at: (data as any).deleted_at,
      status: 'confirmed',
      sender: (data as any).profiles,
      tempId: payload.tempId,
    };
  }

  /**
   * Edit an existing message owned by the user.
   */
  async editMessage(payload: EditMessagePayload, senderId: string): Promise<Message> {
    if (!isSupabaseConfigured || !supabase) {
      return mockChatService.editMessage(payload, senderId);
    }

    const { data, error } = await supabase
      .from('messages')
      .update({
        content: payload.content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', payload.messageId)
      .eq('sender_id', senderId)
      .select(`
        id,
        room_id,
        sender_id,
        content,
        created_at,
        updated_at,
        edited_at,
        deleted_at,
        profiles (
          id,
          username,
          display_name,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to edit message');
    }

    return {
      id: (data as any).id,
      room_id: (data as any).room_id,
      sender_id: (data as any).sender_id,
      content: (data as any).content,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at,
      edited_at: (data as any).edited_at,
      deleted_at: (data as any).deleted_at,
      status: 'confirmed',
      sender: (data as any).profiles,
    };
  }

  /**
   * Soft-delete a message (sets deleted_at timestamp).
   */
  async deleteMessage(payload: DeleteMessagePayload, senderId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return mockChatService.deleteMessage(payload, senderId);
    }

    const { error } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', payload.messageId)
      .eq('sender_id', senderId);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Initialize the designated two-person room as owner (Bootstrap)
   */
  async initializeRoom(name = 'HI'): Promise<{ success: boolean; roomId?: string; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true, roomId: 'room_hi_private_001' };
    }

    try {
      const { data, error } = await supabase.rpc('initialize_chat_room', {
        room_name: name,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const res = data as any;
      return { success: !!res?.success, roomId: res?.room_id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize room';
      return { success: false, error: message };
    }
  }

  /**
   * Create an invitation for the second participant.
   */
  async createInvitation(
    roomId: string,
    invitedEmail: string,
    tokenHash: string,
    durationDays = 7
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { data, error } = await supabase.rpc('create_room_invitation', {
        p_room_id: roomId,
        p_invited_email: invitedEmail.toLowerCase().trim(),
        p_token_hash: tokenHash,
        p_duration_days: durationDays,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const res = data as any;
      return { success: !!res?.success };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invitation';
      return { success: false, error: message };
    }
  }

  /**
   * Redeem an invitation using token hash.
   */
  async redeemInvitation(tokenHash: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true, roomId: 'room_hi_private_001' };
    }

    try {
      const { data, error } = await supabase.rpc('redeem_invitation', {
        p_token_hash: tokenHash,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const res = data as any;
      return { success: !!res?.success, roomId: res?.room_id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to redeem invitation';
      return { success: false, error: message };
    }
  }

  /**
   * Realtime subscription hook for room messages.
   * Handles postgres_changes INSERT, UPDATE, and DELETE.
   */
  subscribeToRoomMessages(
    roomId: string,
    handlers: {
      onInsert: (message: Message) => void;
      onUpdate: (message: Message) => void;
      onDelete: (messageId: string) => void;
    }
  ): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return mockChatService.subscribe(({ event, message }) => {
        if (message.room_id !== roomId) return;
        if (event === 'INSERT') handlers.onInsert(message);
        if (event === 'UPDATE') handlers.onUpdate(message);
        if (event === 'DELETE') handlers.onDelete(message.id);
      });
    }

    const channel: RealtimeChannel = supabase
      .channel(`room:${roomId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async payload => {
          const newRow = payload.new as any;
          if (newRow && !newRow.deleted_at) {
            // Fetch sender profile if not attached
            const { data: profile } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', newRow.sender_id)
              .single();

            handlers.onInsert({
              id: newRow.id,
              room_id: newRow.room_id,
              sender_id: newRow.sender_id,
              content: newRow.content,
              created_at: newRow.created_at,
              updated_at: newRow.updated_at,
              edited_at: newRow.edited_at,
              deleted_at: newRow.deleted_at,
              status: 'confirmed',
              sender: (profile as any) ?? undefined,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        payload => {
          const updatedRow = payload.new as any;
          if (updatedRow.deleted_at) {
            handlers.onDelete(updatedRow.id);
          } else {
            handlers.onUpdate({
              id: updatedRow.id,
              room_id: updatedRow.room_id,
              sender_id: updatedRow.sender_id,
              content: updatedRow.content,
              created_at: updatedRow.created_at,
              updated_at: updatedRow.updated_at,
              edited_at: updatedRow.edited_at,
              deleted_at: updatedRow.deleted_at,
              status: 'confirmed',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        payload => {
          const oldRow = payload.old as any;
          if (oldRow?.id) {
            handlers.onDelete(oldRow.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }
}

export const chatService = new ChatService();

