import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '@/features/auth/auth.service';
import { mockAuthService } from '@/lib/mock/mockAuthService';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type {
  AuthState,
  UserProfile,
  RoomAccessStatus,
  SignInParams,
  SignUpParams,
  ResetPasswordParams,
  UpdatePasswordParams,
} from '@/features/auth/auth.types';

interface AuthContextType extends AuthState {
  signIn: (params: SignInParams) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (params: ResetPasswordParams) => Promise<{ error: string | null }>;
  updatePassword: (params: UpdatePasswordParams) => Promise<{ error: string | null }>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  checkRoomAccess: () => Promise<void>;
  switchMockUser?: (target: 'alex' | 'jordan') => void;
  isMockMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessStatus, setAccessStatus] = useState<RoomAccessStatus>('checking');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkRoomAccess = useCallback(async () => {
    if (!user) {
      setAccessStatus('unauthorized');
      setActiveRoomId(null);
      return;
    }

    try {
      const { status, roomId } = await authService.checkRoomMembership(user.id);
      setAccessStatus(status);
      setActiveRoomId(roomId);
    } catch {
      setAccessStatus('unauthorized');
      setActiveRoomId(null);
    }
  }, [user]);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const { session: currentSession, user: currentUser } = await authService.getSession();
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await authService.getProfile(currentUser.id);
        setProfile(userProfile);
        const { status, roomId } = await authService.checkRoomMembership(currentUser.id);
        setAccessStatus(status);
        setActiveRoomId(roomId);
      } else {
        setProfile(null);
        setAccessStatus('unauthorized');
        setActiveRoomId(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Initialization failed';
      setError(msg);
      setAccessStatus('unauthorized');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const unsubscribe = authService.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        const userProfile = await authService.getProfile(newUser.id);
        setProfile(userProfile);
        const { status, roomId } = await authService.checkRoomMembership(newUser.id);
        setAccessStatus(status);
        setActiveRoomId(roomId);
      } else {
        setProfile(null);
        setAccessStatus('unauthorized');
        setActiveRoomId(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [initAuth]);

  const signIn = async (params: SignInParams) => {
    setError(null);
    setIsLoading(true);
    try {
      const { user: authedUser, profile: authedProfile, error: signInError } = await authService.signIn(params);
      if (signInError) {
        setError(signInError);
        setIsLoading(false);
        return { error: signInError };
      }

      setUser(authedUser);
      setProfile(authedProfile);

      if (authedUser) {
        const { status, roomId } = await authService.checkRoomMembership(authedUser.id);
        setAccessStatus(status);
        setActiveRoomId(roomId);
      }

      setIsLoading(false);
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      setIsLoading(false);
      return { error: msg };
    }
  };

  const signUp = async (params: SignUpParams) => {
    setError(null);
    setIsLoading(true);
    try {
      const { user: registeredUser, profile: registeredProfile, error: signUpError } = await authService.signUp(params);
      if (signUpError) {
        setError(signUpError);
        setIsLoading(false);
        return { error: signUpError };
      }

      setUser(registeredUser);
      setProfile(registeredProfile);

      if (registeredUser) {
        const { status, roomId } = await authService.checkRoomMembership(registeredUser.id);
        setAccessStatus(status);
        setActiveRoomId(roomId);
      }

      setIsLoading(false);
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      setIsLoading(false);
      return { error: msg };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setAccessStatus('unauthorized');
    setActiveRoomId(null);
    setIsLoading(false);
  };

  const resetPassword = async (params: ResetPasswordParams) => {
    return authService.resetPasswordForEmail(params);
  };

  const updatePassword = async (params: UpdatePasswordParams) => {
    return authService.updatePassword(params);
  };

  const checkUsernameAvailability = async (uname: string): Promise<boolean> => {
    return authService.checkUsernameAvailability(uname);
  };

  const switchMockUser = (target: 'alex' | 'jordan') => {
    if (!isSupabaseConfigured) {
      mockAuthService.switchMockUser(target);
      initAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        accessStatus,
        activeRoomId,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        checkUsernameAvailability,
        checkRoomAccess,
        switchMockUser,
        isMockMode: !isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

