import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { ProfileRow } from '../types/database';

interface AuthContextValue {
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  linkDiscord: () => Promise<{ error: string | null }>;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile((data as ProfileRow) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user.id) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, username) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    return { error: error?.message ?? null };
  };

  // Links a Discord identity to the CURRENTLY LOGGED IN account.
  // Requires "Manual Linking" enabled in Supabase Auth settings.
  // Unlike signInWithOAuth, this does not create a new account/session —
  // it attaches Discord as an extra login method to the existing user,
  // so their username (set at email/password registration) never changes.
  const linkDiscord: AuthContextValue['linkDiscord'] = async () => {
    if (!session) return { error: 'Musisz być zalogowany, aby połączyć konto z Discordem.' };
    try {
      const { data, error } = await supabase.auth.linkIdentity({ provider: 'discord' });
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[linkDiscord] Supabase error:', error);
        return { error: error.message };
      }
      // eslint-disable-next-line no-console
      console.log('[linkDiscord] OAuth URL returned, redirecting...', data);
      return { error: null };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[linkDiscord] Unexpected exception:', err);
      return { error: err?.message ?? 'Nieznany błąd podczas łączenia z Discordem.' };
    }
  };

  // Plain OAuth sign-in. Only meant for RETURNING users who already ran
  // linkDiscord() once while logged in via email — Supabase will then log
  // them into their existing account instead of creating a new one. If
  // someone who never linked clicks this, Supabase creates a fresh account
  // (username falling back to their email) — that's the case we're trying
  // to avoid, so this button should stay off the registration screen.
  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'discord' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  };

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signUp,
    linkDiscord,
    signInWithDiscord,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
