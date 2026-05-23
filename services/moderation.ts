import { mockProfiles } from "../data/mockProfiles";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { Profile, SafetyMode } from "../types";

export type ReportTargetType = "profile" | "place" | "message" | "group" | "event";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "misinformation"
  | "impersonation"
  | "unsafe_meetup"
  | "other";

export const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "spam", label: "Spam o promocion", description: "Mensajes repetidos, publicidad o enlaces sospechosos." },
  { value: "harassment", label: "Acoso o amenazas", description: "Lenguaje agresivo, intimidacion o discriminacion." },
  {
    value: "inappropriate_content",
    label: "Contenido inapropiado",
    description: "Material sexual, violento o que no pertenece a un chat local."
  },
  {
    value: "misinformation",
    label: "Desinformacion",
    description: "Datos falsos sobre el lugar, eventos o personas."
  },
  {
    value: "impersonation",
    label: "Suplantacion de identidad",
    description: "Alguien dice ser otra persona o cuenta del lugar."
  },
  {
    value: "unsafe_meetup",
    label: "Encuentro inseguro",
    description: "Convocatoria que pone en riesgo a otras personas."
  },
  { value: "other", label: "Otro", description: "Cuentanos brevemente que esta pasando." }
];

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason | string;
  details?: string | null;
};

export type BlockedProfile = {
  blockedId: string;
  createdAt: string;
  profile: Profile | null;
};

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

type BlockRow = {
  blocked_id: string;
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

const MOCK_BLOCKS_KEY = "__aldea_mock_blocks";

type MockBlocksState = Map<string, string>;

function getMockBlocks(): MockBlocksState {
  const globalRef = globalThis as unknown as Record<string, MockBlocksState | undefined>;

  if (!globalRef[MOCK_BLOCKS_KEY]) {
    globalRef[MOCK_BLOCKS_KEY] = new Map<string, string>();
  }

  return globalRef[MOCK_BLOCKS_KEY] as MockBlocksState;
}

export async function reportContent(input: CreateReportInput): Promise<{ id: string }> {
  const reason = String(input.reason).trim();

  if (!reason) {
    throw new Error("Report reason cannot be empty.");
  }

  if (!isSupabaseConfigured || !supabase) {
    return { id: `mock-report-${Date.now()}` };
  }

  const reporterId = await getCurrentUserId();

  if (!reporterId) {
    throw new Error("You must be authenticated to report content.");
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason,
      details: input.details ?? null
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create report.");
  }

  return data as { id: string };
}

export async function blockUser(blockedId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    getMockBlocks().set(blockedId, new Date().toISOString());
    return;
  }

  const blockerId = await getCurrentUserId();

  if (!blockerId) {
    throw new Error("You must be authenticated to block a user.");
  }

  if (blockerId === blockedId) {
    throw new Error("You cannot block yourself.");
  }

  const { error } = await supabase
    .from("blocks")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true });

  if (error) {
    throw error;
  }
}

export async function unblockUser(blockedId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    getMockBlocks().delete(blockedId);
    return;
  }

  const blockerId = await getCurrentUserId();

  if (!blockerId) {
    throw new Error("You must be authenticated to unblock a user.");
  }

  const { error } = await supabase.from("blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);

  if (error) {
    throw error;
  }
}

export async function listBlockedUserIds(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) {
    return Array.from(getMockBlocks().keys());
  }

  const blockerId = await getCurrentUserId();

  if (!blockerId) {
    return [];
  }

  const { data, error } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", blockerId);

  if (error || !data) {
    console.warn("Could not load blocked ids:", error?.message);
    return [];
  }

  return (data as { blocked_id: string }[]).map((row) => row.blocked_id);
}

export async function listBlockedProfiles(): Promise<BlockedProfile[]> {
  if (!isSupabaseConfigured || !supabase) {
    const blocks = getMockBlocks();

    return Array.from(blocks.entries()).map(([blockedId, createdAt]) => ({
      blockedId,
      createdAt,
      profile: mockProfiles.find((profile) => profile.id === blockedId) ?? null
    }));
  }

  const blockerId = await getCurrentUserId();

  if (!blockerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("blocks")
    .select(
      "blocked_id, created_at, profiles:blocked_id(id, username, display_name, avatar_url, bio, safety_mode, created_at, updated_at)"
    )
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Could not load blocked profiles:", error?.message);
    return [];
  }

  return (data as BlockRow[]).map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    return {
      blockedId: row.blocked_id,
      createdAt: row.created_at,
      profile: profileRow ? mapProfileRow(profileRow) : null
    };
  });
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  const ids = await listBlockedUserIds();
  return ids.includes(userId);
}
