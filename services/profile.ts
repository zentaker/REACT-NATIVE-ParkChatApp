import { mockProfiles } from "../data/mockProfiles";
import { MOCK_USER_ID } from "../lib/constants";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { Profile, SafetyMode } from "../types";

export type UpdateProfileInput = Partial<Pick<Profile, "displayName" | "avatarUrl" | "bio" | "safetyMode">>;

type ProfileRow = {
  id: string;
  username?: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  safety_mode?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username ?? null,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    safetyMode: (row.safety_mode ?? "standard") as SafetyMode,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function mockCurrentProfile() {
  return mockProfiles.find((profile) => profile.id === MOCK_USER_ID) ?? mockProfiles[0] ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return mockCurrentProfile();
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) {
    console.warn("Falling back to mock profile:", error?.message);
    return mockCurrentProfile();
  }

  return mapProfileRow(data as ProfileRow);
}

export async function updateProfile(input: UpdateProfileInput): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) {
    const current = mockCurrentProfile();

    return current
      ? {
          ...current,
          ...input,
          updatedAt: new Date().toISOString()
        }
      : null;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be authenticated to update your profile.");
  }

  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString()
  };

  if (input.displayName !== undefined) payload.display_name = input.displayName;
  if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl;
  if (input.bio !== undefined) payload.bio = input.bio;
  const { data, error } = await supabase.from("profiles").update(payload).eq("id", userId).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update profile.");
  }

  return mapProfileRow(data as ProfileRow);
}
