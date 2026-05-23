import { mockMessages } from "../data/mockMessages";
import { mockProfiles } from "../data/mockProfiles";
import { MOCK_USER_ID } from "../lib/constants";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { ModerationStatus, PlaceMessage, Profile, SafetyMode } from "../types";

export const MESSAGE_RATE_LIMIT_MAX = 5;
export const MESSAGE_RATE_LIMIT_WINDOW_MS = 60_000;

const recentSendTimestamps: number[] = [];
let lastSentBodyNormalized = "";

export type MessageRateLimitReason = "frequency" | "duplicate";

export class MessageRateLimitError extends Error {
  reason: MessageRateLimitReason;
  retryAfterMs: number;

  constructor(reason: MessageRateLimitReason, retryAfterMs: number) {
    super(
      reason === "duplicate"
        ? "No repitas el mismo mensaje seguido."
        : `Estas enviando muy rapido. Espera ${Math.max(1, Math.ceil(retryAfterMs / 1000))}s antes del siguiente mensaje.`
    );
    this.name = "MessageRateLimitError";
    this.reason = reason;
    this.retryAfterMs = retryAfterMs;
  }
}

function pruneRecentTimestamps(now: number) {
  while (recentSendTimestamps.length > 0 && now - recentSendTimestamps[0] > MESSAGE_RATE_LIMIT_WINDOW_MS) {
    recentSendTimestamps.shift();
  }
}

export type MessageRateLimitStatus = {
  remaining: number;
  retryAfterMs: number;
  max: number;
  windowMs: number;
};

export function getMessageRateLimitStatus(): MessageRateLimitStatus {
  const now = Date.now();
  pruneRecentTimestamps(now);
  const used = recentSendTimestamps.length;
  const remaining = Math.max(0, MESSAGE_RATE_LIMIT_MAX - used);
  const retryAfterMs = remaining === 0 && used > 0 ? MESSAGE_RATE_LIMIT_WINDOW_MS - (now - recentSendTimestamps[0]) : 0;
  return { remaining, retryAfterMs, max: MESSAGE_RATE_LIMIT_MAX, windowMs: MESSAGE_RATE_LIMIT_WINDOW_MS };
}

function normalizeBody(body: string): string {
  return body.trim().toLowerCase().replace(/\s+/g, " ");
}

function assertCanSendMessage(trimmedBody: string) {
  const status = getMessageRateLimitStatus();
  if (status.retryAfterMs > 0) {
    throw new MessageRateLimitError("frequency", status.retryAfterMs);
  }
  const normalized = normalizeBody(trimmedBody);
  if (normalized.length > 0 && normalized === lastSentBodyNormalized) {
    throw new MessageRateLimitError("duplicate", 0);
  }
}

function recordSentMessage(trimmedBody: string) {
  recentSendTimestamps.push(Date.now());
  lastSentBodyNormalized = normalizeBody(trimmedBody);
}

export function __resetMessageRateLimitForTests() {
  recentSendTimestamps.length = 0;
  lastSentBodyNormalized = "";
}

type ProfileRow = {
  id: string;
  username?: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  safety_mode?: string | null;
  is_moderator?: boolean | null;
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
    isModerator: Boolean(row.is_moderator),
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

export function createOptimisticPlaceMessage(
  placeId: string,
  body: string,
  profile: Profile | null
): PlaceMessage {
  const trimmedBody = body.trim();
  const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: tempId,
    placeId,
    userId: profile?.id ?? null,
    body: trimmedBody,
    moderationStatus: "visible",
    createdAt: new Date().toISOString(),
    profile
  };
}

export async function sendPlaceMessage(placeId: string, body: string): Promise<PlaceMessage> {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("Message body cannot be empty.");
  }

  assertCanSendMessage(trimmedBody);

  if (!isSupabaseConfigured || !supabase) {
    const profile = mockProfiles.find((item) => item.id === MOCK_USER_ID) ?? mockProfiles[0];

    recordSentMessage(trimmedBody);

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
    const rawMessage = error?.message ?? "";
    if (rawMessage.includes("rate_limit_exceeded")) {
      throw new MessageRateLimitError("frequency", MESSAGE_RATE_LIMIT_WINDOW_MS);
    }
    if (rawMessage.includes("duplicate_message")) {
      throw new MessageRateLimitError("duplicate", 0);
    }
    throw new Error(rawMessage || "Could not send message.");
  }

  recordSentMessage(trimmedBody);

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
