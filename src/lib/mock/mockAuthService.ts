import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import type { UserProfile, RoomAccessStatus } from '@/features/auth/auth.types';
import { MOCK_USER_ALEX, MOCK_USER_JORDAN, MOCK_ROOM_ID } from './mockData';

const STORAGE_KEY_USER = 'hi_mock_current_user_id';
const STORAGE_KEY_PENDING = 'hi_mock_pending_users';

class MockAuthService {
  private currentUserId: string = MOCK_USER_ALEX.id;
  private listeners: Array<() => void> = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved && (saved === MOCK_USER_ALEX.id || saved === MOCK_USER_JORDAN.id)) {
      this.currentUserId = saved;
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getCurrentProfile(): UserProfile | null {
    if (this.currentUserId === MOCK_USER_ALEX.id) return MOCK_USER_ALEX;
    if (this.currentUserId === MOCK_USER_JORDAN.id) return MOCK_USER_JORDAN;
    
    // Check pending registered user
    const pendingJson = localStorage.getItem(STORAGE_KEY_PENDING);
    if (pendingJson) {
      try {
        const pendingUsers: UserProfile[] = JSON.parse(pendingJson);
        const found = pendingUsers.find(u => u.id === this.currentUserId);
        if (found) return found;
      } catch {
        // ignore
      }
    }
    return null;
  }

  public getCurrentUser(): SupabaseUser | null {
    const profile = this.getCurrentProfile();
    if (!profile) return null;
    return {
      id: profile.id,
      app_metadata: {},
      user_metadata: { display_name: profile.display_name },
      aud: 'authenticated',
      created_at: profile.created_at,
      email: profile.id === MOCK_USER_ALEX.id ? 'alex@hi.chat' : profile.id === MOCK_USER_JORDAN.id ? 'jordan@hi.chat' : 'user@hi.chat',
    } as unknown as SupabaseUser;
  }

  public getCurrentSession(): SupabaseSession | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    return {
      access_token: 'mock-jwt-token-for-dev-preview',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user,
    } as unknown as SupabaseSession;
  }

  public async signIn(username: string): Promise<{ profile: UserProfile; status: RoomAccessStatus }> {
    await new Promise(r => setTimeout(r, 300));
    const normalized = username.toLowerCase().trim();

    if (normalized === 'alex' || normalized.includes('alex')) {
      this.currentUserId = MOCK_USER_ALEX.id;
      localStorage.setItem(STORAGE_KEY_USER, this.currentUserId);
      this.notify();
      return { profile: MOCK_USER_ALEX, status: 'authorized' };
    }

    if (normalized === 'jordan' || normalized.includes('jordan')) {
      this.currentUserId = MOCK_USER_JORDAN.id;
      localStorage.setItem(STORAGE_KEY_USER, this.currentUserId);
      this.notify();
      return { profile: MOCK_USER_JORDAN, status: 'authorized' };
    }

    // Check pending registered users
    const pendingJson = localStorage.getItem(STORAGE_KEY_PENDING);
    if (pendingJson) {
      try {
        const pending: UserProfile[] = JSON.parse(pendingJson);
        const match = pending.find(u => u.username?.toLowerCase() === normalized);
        if (match) {
          this.currentUserId = match.id;
          localStorage.setItem(STORAGE_KEY_USER, this.currentUserId);
          this.notify();
          return { profile: match, status: 'pending_approval' };
        }
      } catch {
        // ignore
      }
    }

    // Default to Alex if user clicks preview sign in without typing
    this.currentUserId = MOCK_USER_ALEX.id;
    localStorage.setItem(STORAGE_KEY_USER, this.currentUserId);
    this.notify();
    return { profile: MOCK_USER_ALEX, status: 'authorized' };
  }

  public checkUsernameAvailability(username: string): boolean {
    const clean = username.toLowerCase().trim();
    if (clean === 'alex' || clean === 'jordan') return false;
    const pendingJson = localStorage.getItem(STORAGE_KEY_PENDING);
    if (pendingJson) {
      try {
        const pending: UserProfile[] = JSON.parse(pendingJson);
        if (pending.some(u => u.username?.toLowerCase() === clean)) {
          return false;
        }
      } catch {
        // ignore
      }
    }
    return true;
  }

  public async signUp(username: string, _email: string, displayName?: string): Promise<{ profile: UserProfile; status: RoomAccessStatus }> {
    await new Promise(r => setTimeout(r, 400));
    const cleanUsername = username.toLowerCase().trim();
    const newProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      display_name: displayName?.trim() || cleanUsername,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store in pending users
    const pendingJson = localStorage.getItem(STORAGE_KEY_PENDING);
    const pending: UserProfile[] = pendingJson ? JSON.parse(pendingJson) : [];
    pending.push(newProfile);
    localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pending));

    this.currentUserId = newProfile.id;
    localStorage.setItem(STORAGE_KEY_USER, this.currentUserId);
    this.notify();

    // In accordance with Section 5.B & 7: registration does NOT automatically grant private room access!
    return { profile: newProfile, status: 'pending_approval' };
  }

  public async signOut(): Promise<void> {
    await new Promise(r => setTimeout(r, 150));
    localStorage.removeItem(STORAGE_KEY_USER);
    this.currentUserId = '';
    this.notify();
  }

  public async checkRoomAccess(userId: string): Promise<{ status: RoomAccessStatus; roomId: string | null }> {
    if (userId === MOCK_USER_ALEX.id || userId === MOCK_USER_JORDAN.id) {
      return { status: 'authorized', roomId: MOCK_ROOM_ID };
    }
    return { status: 'pending_approval', roomId: null };
  }

  public switchMockUser(target: 'alex' | 'jordan') {
    this.currentUserId = target === 'alex' ? MOCK_USER_ALEX.id : MOCK_USER_JORDAN.id;
    localStorage.setItem(STORAGE_KEY_USER, this.currentUserId);
    this.notify();
  }
}

export const mockAuthService = new MockAuthService();
