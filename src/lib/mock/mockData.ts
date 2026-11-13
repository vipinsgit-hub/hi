import type { UserProfile } from '@/features/auth/auth.types';
import type { Message, ChatRoom } from '@/features/chat/chat.types';

export const MOCK_USER_ALEX: UserProfile = {
  id: 'usr_alex_001',
  username: 'alex',
  display_name: 'Alex Rivera',
  avatar_url: null,
  created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
};

export const MOCK_USER_JORDAN: UserProfile = {
  id: 'usr_jordan_002',
  username: 'jordan',
  display_name: 'Jordan Vance',
  avatar_url: null,
  created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
};

export const MOCK_ROOM_ID = 'room_hi_private_001';

export const MOCK_ROOM: ChatRoom = {
  id: MOCK_ROOM_ID,
  name: 'HI',
  created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  members: [
    {
      id: 'mem_001',
      room_id: MOCK_ROOM_ID,
      user_id: MOCK_USER_ALEX.id,
      role: 'owner',
      joined_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      profile: MOCK_USER_ALEX,
    },
    {
      id: 'mem_002',
      room_id: MOCK_ROOM_ID,
      user_id: MOCK_USER_JORDAN.id,
      role: 'member',
      joined_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      profile: MOCK_USER_JORDAN,
    },
  ],
};

const now = Date.now();
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

export const INITIAL_MOCK_MESSAGES: Message[] = [
  {
    id: 'msg_001',
    room_id: MOCK_ROOM_ID,
    sender_id: MOCK_USER_JORDAN.id,
    content: 'Hey Alex! Just testing the new private channel.',
    created_at: new Date(now - 1.5 * oneDay).toISOString(),
    updated_at: new Date(now - 1.5 * oneDay).toISOString(),
    edited_at: null,
    deleted_at: null,
    status: 'confirmed',
    sender: MOCK_USER_JORDAN,
  },
  {
    id: 'msg_002',
    room_id: MOCK_ROOM_ID,
    sender_id: MOCK_USER_ALEX.id,
    content: 'It works cleanly. End-to-end encrypted feel with zero third-party telemetry.',
    created_at: new Date(now - 1.5 * oneDay + 5 * 60000).toISOString(),
    updated_at: new Date(now - 1.5 * oneDay + 5 * 60000).toISOString(),
    edited_at: null,
    deleted_at: null,
    status: 'confirmed',
    sender: MOCK_USER_ALEX,
  },
  {
    id: 'msg_003',
    room_id: MOCK_ROOM_ID,
    sender_id: MOCK_USER_JORDAN.id,
    content: 'Obsidian theme looks great in low light. Love the typography.',
    created_at: new Date(now - 3 * oneHour).toISOString(),
    updated_at: new Date(now - 3 * oneHour).toISOString(),
    edited_at: null,
    deleted_at: null,
    status: 'confirmed',
    sender: MOCK_USER_JORDAN,
  },
  {
    id: 'msg_004',
    room_id: MOCK_ROOM_ID,
    sender_id: MOCK_USER_ALEX.id,
    content: 'Agreed. Let’s make sure we verify PWA offline shell and responsive viewports before we finalize.',
    created_at: new Date(now - 45 * 60000).toISOString(),
    updated_at: new Date(now - 45 * 60000).toISOString(),
    edited_at: null,
    deleted_at: null,
    status: 'confirmed',
    sender: MOCK_USER_ALEX,
  },
];

