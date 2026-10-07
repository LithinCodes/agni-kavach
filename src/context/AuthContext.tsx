import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, initSupabaseFromConfig } from '../services/supabase';

export type AuthMode = 'OPERATIONAL' | 'READ_ONLY';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  authMode: AuthMode;
  isAuthModalOpen: boolean;
  authModalReason: string | null;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; message?: string; sessionActive?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authListenerUnsubscribe: (() => void) | null = null;

    async function initAuth() {
      try {
        let client = getSupabase();
        if (!client) {
          const configRes = await initSupabaseFromConfig();
          if (configRes.success) {
            client = getSupabase();
          }
        }

        if (client && isMounted) {
          // 1. Restore existing session on page load
          const { data, error } = await client.auth.getSession();
          if (!error && data?.session) {
            setSession(data.session);
            setUser(data.session.user ?? null);
          }

          // 2. Subscribe to Supabase Auth state changes
          const { data: authListener } = client.auth.onAuthStateChange((_event, currentSession) => {
            if (!isMounted) return;
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
          });

          authListenerUnsubscribe = () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.warn('[AGNI KAVACH AUTH] Session initialization notice:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      if (authListenerUnsubscribe) {
        authListenerUnsubscribe();
      }
    };
  }, []);

  const openAuthModal = (reason?: string) => {
    setAuthModalReason(reason || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalReason(null);
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    let client = getSupabase();
    if (!client) {
      await initSupabaseFromConfig();
      client = getSupabase();
    }
    if (!client) {
      return { success: false, error: 'Database service client not available.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Authentication failed due to network connectivity.',
      };
    }
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; message?: string; sessionActive?: boolean }> => {
    let client = getSupabase();
    if (!client) {
      await initSupabaseFromConfig();
      client = getSupabase();
    }
    if (!client) {
      return { success: false, error: 'Database service client not available.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        const msg = error.message;
        if (msg.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            error:
              'Supabase email confirmation rate limit reached on built-in SMTP. If you already have an account, please Sign In. Otherwise, disable email confirmation in Supabase Auth settings to allow instant account creation.',
          };
        }
        return { success: false, error: msg };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        return {
          success: true,
          sessionActive: true,
          message: 'Operator account created and authenticated successfully.',
        };
      }

      return {
        success: true,
        sessionActive: false,
        message:
          'Account created. A confirmation email has been dispatched. Once confirmed, sign in to receive operational access.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Registration request could not be processed.',
      };
    }
  };

  const signOut = async () => {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('[AGNI KAVACH AUTH] SignOut error:', err);
      }
    }
    setSession(null);
    setUser(null);
  };

  const value = useMemo<AuthContextType>(() => {
    const isAuthed = Boolean(user && session);
    return {
      user,
      session,
      token: session?.access_token || null,
      loading,
      isAuthenticated: isAuthed,
      authMode: isAuthed ? 'OPERATIONAL' : 'READ_ONLY',
      isAuthModalOpen,
      authModalReason,
      openAuthModal,
      closeAuthModal,
      signIn,
      signUp,
      signOut,
    };
  }, [user, session, loading, isAuthModalOpen, authModalReason]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
