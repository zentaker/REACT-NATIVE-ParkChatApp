import { mockMessages } from "../data/mockMessages";
import { mockProfiles } from "../data/mockProfiles";
import { MOCK_USER_ID } from "../lib/constants";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { ModerationStatus, PlaceMessage, Profile, SafetyMode } from "../types";

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

type PlaceMessageRow = {
  id: string;
  place_id: string;
  user_id: string | null;
  body: string;
  moderation_status?: string | null;
  created_at: string;
  profiles?: ProfileRow | ProfileRow[] | null;
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

function mapMessageRow(row: PlaceMessageRow): PlaceMessage {
  const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    body: row.body,
    moderationStatus: (row.moderation_status ?? "visible") as ModerationStatus,
    createdAt: row.created_at,
    profile: profileRow ? mapProfileRow(profileRow) : null
  };
}

export async function getPlaceMessages(placeId: string): Promise<PlaceMessage[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockMessages.filter((message) => message.placeId === placeId);
  }

  const { data, error } = await supabase
    .from("place_messages")
    .select("*, profiles:user_id(id, display_name, avatar_url, bio, created_at, updated_at)")
    .eq("place_id", placeId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.warn("Falling back to mock messages:", error?.message);
    return mockMessages.filter((message) => message.placeId === placeId);
  }

  return (data as PlaceMessageRow[]).map(mapMessageRow);
}

export async function sendPlaceMessage(placeId: string, body: string): Promise<PlaceMessage> {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("Message body cannot be empty.");
  }

  if (!isSupabaseConfigured || !supabase) {
    const profile = mockProfiles.find((item) => item.id === MOCK_USER_ID) ?? mockProfiles[0];

    return {
      id: `mock-message-${Date.now()}`,
      placeId,
      userId: profile.id,
      body: trimmedBody,
      moderationStatus: "visible",
      createdAt: new Date().toISOString(),
      profile
    };
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be authenticated to send a message.");
  }

  const { data, error } = await supabase
    .from("place_messages")
    .insert({ place_id: placeId, user_id: userId, body: trimmedBody })
    .select("*, profiles:user_id(id, display_name, avatar_url, bio, created_at, updated_at)")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not send message.");
  }

  return mapMessageRow(data as PlaceMessageRow);
}

export function subscribeToPlaceMessages(
  placeId: string,
  callback: (message: PlaceMessage) => void
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => undefined;
  }

  const channel = supabase
    .channel(`place-messages:${placeId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "place_messages",
        filter: `place_id=eq.${placeId}`
      },
      (payload) => {
        callback(mapMessageRow(payload.new as PlaceMessageRow));
      }
    )
    .subscribe();

  return () => {
    void channel.unsubscribe();
  };
}
