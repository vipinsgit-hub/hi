import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type RoomAccessStatus = 'checking' | 'authorized' | 'pending_approval' | 'unauthorized';

export interface AuthState {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: SupabaseSession | null;
  isLoading: boolean;
  accessStatus: RoomAccessStatus;
  activeRoomId: string | null;
  error: string | null;
}

export interface SignUpParams {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInParams {
  username: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdatePasswordParams {
  newPassword: string;
}

export interface AuthResult<T = void> {
  data?: T;
  error?: string | null;
}
