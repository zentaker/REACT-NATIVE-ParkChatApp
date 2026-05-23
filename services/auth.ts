import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = SignInInput & {
  displayName: string;
};

export type AuthChangeCallback = (event: AuthChangeEvent | "MOCK_INITIAL_SESSION", session: Session | null) => void;

export function isMockAuthMode() {
  return !isSupabaseConfigured || !supabase;
}

export async function signInWithEmail({ email, password }: SignInInput): Promise<{ user: User | null; session: Session | null }> {
  const client = supabase;

  if (!isSupabaseConfigured || !client) {
    return { user: null, session: null };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    session: data.session
  };
}

export async function signUpWithEmail({
  displayName,
  email,
  password
}: SignUpInput): Promise<{ user: User | null; session: Session | null }> {
  const client = supabase;

  if (!isSupabaseConfigured || !client) {
    return { user: null, session: null };
  }

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim()
      }
    }
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    const { error: profileError } = await client.from("profiles").upsert({
      id: data.user.id,
      display_name: displayName.trim() || email.trim(),
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.warn("Profile upsert after sign-up did not complete:", profileError.message);
    }
  }

  return {
    user: data.user,
    session: data.session
  };
}

export async function signOut(): Promise<void> {
  const client = supabase;

  if (!isSupabaseConfigured || !client) {
    return;
  }

  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession(): Promise<Session | null> {
  const client = supabase;

  if (!isSupabaseConfigured || !client) {
    return null;
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function onAuthStateChange(callback: AuthChangeCallback): () => void {
  const client = supabase;

  if (!isSupabaseConfigured || !client) {
    callback("MOCK_INITIAL_SESSION", null);
    return () => undefined;
  }

  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const client = supabase;

  if (!isSupabaseConfigured || !client) {
    return null;
  }

  const { data, error } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user?.id ?? null;
}
