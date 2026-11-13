import { describe, it, expect } from 'vitest';
import type { Message } from './chat.types';

describe('Message Reconciliation and Duplicate Prevention', () => {
  it('deduplicates messages by id', () => {
    const existing: Message[] = [
      {
        id: 'msg_001',
        room_id: 'room_1',
        sender_id: 'usr_1',
        content: 'Hi',
        created_at: '2026-02-12T10:00:00Z',
        updated_at: '2026-02-12T10:00:00Z',
        edited_at: null,
        deleted_at: null,
        status: 'confirmed',
      },
    ];

    const incoming: Message = {
      id: 'msg_001',
      room_id: 'room_1',
      sender_id: 'usr_1',
      content: 'Hi',
      created_at: '2026-02-12T10:00:00Z',
      updated_at: '2026-02-12T10:00:00Z',
      edited_at: null,
      deleted_at: null,
      status: 'confirmed',
    };

    const isDuplicate = existing.some(m => m.id === incoming.id);
    expect(isDuplicate).toBe(true);
  });

  it('reconciles optimistic temporary message when server confirms with real id', () => {
    const tempId = 'temp_12345';
    const optimisticList: Message[] = [
      {
        id: tempId,
        tempId: tempId,
        room_id: 'room_1',
        sender_id: 'usr_1',
        content: 'Optimistic Hello',
        created_at: '2026-02-12T10:00:00Z',
        updated_at: '2026-02-12T10:00:00Z',
        edited_at: null,
        deleted_at: null,
        status: 'sending',
      },
    ];

    const serverConfirmed: Message = {
      id: 'msg_server_999',
      tempId: tempId,
      room_id: 'room_1',
      sender_id: 'usr_1',
      content: 'Optimistic Hello',
      created_at: '2026-02-12T10:00:01Z',
      updated_at: '2026-02-12T10:00:01Z',
      edited_at: null,
      deleted_at: null,
      status: 'confirmed',
    };

    const reconciled = optimisticList.map(m =>
      m.tempId === serverConfirmed.tempId || m.id === serverConfirmed.tempId
        ? { ...serverConfirmed, status: 'confirmed' as const }
        : m
    );

    expect(reconciled).toHaveLength(1);
    expect(reconciled[0].id).toBe('msg_server_999');
    expect(reconciled[0].status).toBe('confirmed');
  });
});

