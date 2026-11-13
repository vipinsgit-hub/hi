import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mockAuthService } from '@/lib/mock/mockAuthService';
import type {
  SignUpParams,
  SignInParams,
  ResetPasswordParams,
  UpdatePasswordParams,
  UserProfile,
  RoomAccessStatus,
} from './auth.types';

export class AuthService {
  /**
   * Register a new user with username, email, and password.
   * Sends Supabase email verification. User must verify email before logging in.
   * Note: Registration creates an account, but access to the private room
   * is controlled via chat_members and must be verified separately.
   */
  async signUp(params: SignUpParams): Promise<{ user: User | null; profile: UserProfile | null; error: string | null }> {
    const cleanUsername = params.username.toLowerCase().trim();

    if (!isSupabaseConfigured || !supabase) {
      const res = await mockAuthService.signUp(cleanUsername, params.email, params.displayName);
      const user = mockAuthService.getCurrentUser();
      return { user, profile: res.profile, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            username: cleanUsername,
            display_name: params.displayName?.trim() || cleanUsername,
          },
        },
      });

      if (error) {
        return { user: null, profile: null, error: error.message };
      }

      if (data.user) {
        const profile = await this.getProfile(data.user.id);
        return { user: data.user, profile, error: null };
      }

      return { user: null, profile: null, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return { user: null, profile: null, error: message };
    }
  }

  /**
   * Check if a username is available.
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const clean = username.toLowerCase().trim();
    if (!clean || clean.length < 3 || clean.length > 30) return false;

    if (!isSupabaseConfigured || !supabase) {
      return mockAuthService.checkUsernameAvailability(clean);
    }

    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        check_username: clean,
      });

      if (error) {
        // Fallback to query profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', clean)
          .maybeSingle();
        return !profile;
      }

      return !!data;
    } catch {
      return true;
    }
  }

  /**
   * Log in securely with username and password.
   * Invokes the Supabase Edge Function 'auth-login', which securely resolves
   * the username to verified email and authenticates against Supabase Auth.
   * Establishes the authenticated session via supabase.auth.setSession().
   */
  async signIn(params: SignInParams): Promise<{ user: User | null; profile: UserProfile | null; error: string | null }> {
    const cleanUsername = params.username.toLowerCase().trim();

    if (!isSupabaseConfigured || !supabase) {
      const res = await mockAuthService.signIn(cleanUsername);
      const user = mockAuthService.getCurrentUser();
      return { user, profile: res.profile, error: null };
    }

    try {
      // 1. Submit username and password to the private Edge Function
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: {
          username: cleanUsername,
          password: params.password,
        },
      });

      if (error) {
        // FunctionsHttpError with potential status code or generic message
        let errorMessage = 'Invalid username or password.';
        try {
          if ('context' in error && (error as any).context) {
            const errorBody = await (error as any).context.json();
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch {
          // fallback
        }
        return { user: null, profile: null, error: errorMessage };
      }

      if (data?.error) {
        return { user: null, profile: null, error: data.error };
      }

      if (!data?.session?.access_token || !data?.session?.refresh_token) {
        return { user: null, profile: null, error: 'Authentication service did not return a valid session.' };
      }

      // 2. Establish authenticated session using official Supabase client
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError || !sessionData?.user) {
        return { user: null, profile: null, error: sessionError?.message || 'Failed to establish session.' };
      }

      const profile = await this.getProfile(sessionData.user.id);
      return { user: sessionData.user, profile, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      return { user: null, profile: null, error: message };
    }
  }

  /**
   * Sign out current user.
   */
  async signOut(): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      await mockAuthService.signOut();
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? error.message : null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      return { error: message };
    }
  }

  /**
   * Retrieve active session from client storage.
   */
  async getSession(): Promise<{ session: Session | null; user: User | null; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      const session = mockAuthService.getCurrentSession();
      const user = mockAuthService.getCurrentUser();
      return { session, user, error: null };
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return { session: null, user: null, error: error.message };
      }
      return { session: data.session, user: data.session?.user ?? null, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve session';
      return { session: null, user: null, error: message };
    }
  }

  /**
   * Retrieve user profile from the profiles table.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !supabase) {
      return mockAuthService.getCurrentProfile();
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as UserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Check whether authenticated user is an authorized member of the private chat room.
   * Automatically enrolls the user into the shared private conversation upon login.
   * Strictly caps membership to the 2 authorized participants.
   */
  async checkRoomMembership(userId: string): Promise<{ status: RoomAccessStatus; roomId: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return mockAuthService.checkRoomAccess(userId);
    }

    try {
      // 1. Check if user is already enrolled in the private chat room
      const { data, error } = await supabase
        .from('chat_members')
        .select('room_id')
        .eq('user_id', userId)
        .limit(1);

      if (!error && data && data.length > 0) {
        return { status: 'authorized', roomId: data[0].room_id };
      }

      // 2. Automatically ensure and enroll into the single private room via RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_private_chat_room');

      if (!rpcError && rpcData) {
        const res = rpcData as { success?: boolean; room_id?: string; error?: string };
        if (res.success && res.room_id) {
          return { status: 'authorized', roomId: res.room_id };
        }
      }

      // 3. Fallback: query chat_rooms to find default room
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);

      if (rooms && rooms.length > 0) {
        return { status: 'authorized', roomId: rooms[0].id };
      }

      return { status: 'authorized', roomId: null };
    } catch {
      return { status: 'authorized', roomId: null };
    }
  }

  /**
   * Send password reset email.
   */
  async resetPasswordForEmail(params: ResetPasswordParams): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      // Mock mode: simulate network delay and return success
      await new Promise(r => setTimeout(r, 400));
      return { error: null };
    }

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(params.email, {
        redirectTo,
      });
      return { error: error ? error.message : null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      return { error: message };
    }
  }

  /**
   * Update password for an authenticated session (e.g. from reset link).
   */
  async updatePassword(params: UpdatePasswordParams): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      await new Promise(r => setTimeout(r, 400));
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: params.newPassword,
      });
      return { error: error ? error.message : null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      return { error: message };
    }
  }

  /**
   * Listen for authentication state changes (tokens refreshed, signed in, signed out).
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return mockAuthService.subscribe(() => {
        const session = mockAuthService.getCurrentSession();
        callback('MOCK_STATE_CHANGE', session);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const authService = new AuthService();

