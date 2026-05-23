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
  is_moderator?: boolean | null;
  created_at: string;
  updated_at?: string | null;
};

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  actioned: "Con accion",
  dismissed: "Descartado"
};

export type Report = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  reporter: Profile | null;
};

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  created_at: string;
  reporter?: ProfileRow | ProfileRow[] | null;
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
    isModerator: Boolean(row.is_moderator),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function normaliseStatus(value: string | null | undefined): ReportStatus {
  if (value === "reviewed" || value === "actioned" || value === "dismissed") {
    return value;
  }
  return "pending";
}

function mapReportRow(row: ReportRow): Report {
  const reporterRow = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter;

  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type as ReportTargetType,
    targetId: row.target_id,
    reason: row.reason,
    details: row.details,
    status: normaliseStatus(row.status),
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
    reporter: reporterRow ? mapProfileRow(reporterRow) : null
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

const MOCK_REPORTS_KEY = "__aldea_mock_reports";

function getMockReports(): Report[] {
  const globalRef = globalThis as unknown as Record<string, Report[] | undefined>;

  if (!globalRef[MOCK_REPORTS_KEY]) {
    const now = Date.now();
    const reporter = mockProfiles.find((p) => p.id === "00000000-0000-4000-8000-000000000002") ?? null;
    const seedReports: Report[] = [
      {
        id: "mock-report-seed-1",
        reporterId: reporter?.id ?? "00000000-0000-4000-8000-000000000002",
        targetType: "message",
        targetId: "11111111-2222-3333-4444-555555555555",
        reason: "spam",
        details: "Esta cuenta repite el mismo enlace cada hora en el chat del parque.",
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        resolutionNote: null,
        createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
        reporter
      },
      {
        id: "mock-report-seed-2",
        reporterId: "00000000-0000-4000-8000-000000000003",
        targetType: "profile",
        targetId: "00000000-0000-4000-8000-000000000002",
        reason: "harassment",
        details: "Me esta enviando mensajes agresivos despues de un encuentro.",
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        resolutionNote: null,
        createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
        reporter: mockProfiles.find((p) => p.id === "00000000-0000-4000-8000-000000000003") ?? null
      }
    ];
    globalRef[MOCK_REPORTS_KEY] = seedReports;
  }

  return globalRef[MOCK_REPORTS_KEY] as Report[];
}

export async function reportContent(input: CreateReportInput): Promise<{ id: string }> {
  const reason = String(input.reason).trim();

  if (!reason) {
    throw new Error("Report reason cannot be empty.");
  }

  if (!isSupabaseConfigured || !supabase) {
    const id = `mock-report-${Date.now()}`;
    const reporter = mockProfiles[0] ?? null;
    getMockReports().unshift({
      id,
      reporterId: reporter?.id ?? "mock-user",
      targetType: input.targetType,
      targetId: input.targetId,
      reason,
      details: input.details ?? null,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      resolutionNote: null,
      createdAt: new Date().toISOString(),
      reporter
    });
    return { id };
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

export async function isCurrentUserModerator(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    const current = mockProfiles[0];
    return Boolean(current?.isModerator);
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("is_moderator")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return Boolean((data as { is_moderator?: boolean | null }).is_moderator);
}

export type ListReportsOptions = {
  status?: ReportStatus | "all";
};

export async function listReportsForModeration(options: ListReportsOptions = {}): Promise<Report[]> {
  const statusFilter = options.status ?? "pending";

  if (!isSupabaseConfigured || !supabase) {
    const all = getMockReports();
    if (statusFilter === "all") return [...all];
    return all.filter((r) => r.status === statusFilter);
  }

  let query = supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, reviewed_by, reviewed_at, resolution_note, created_at, reporter:reporter_id(id, username, display_name, avatar_url, bio, safety_mode, is_moderator, created_at, updated_at)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load reports.");
  }

  return (data as ReportRow[]).map(mapReportRow);
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  resolutionNote?: string | null
): Promise<Report> {
  if (!isSupabaseConfigured || !supabase) {
    const reports = getMockReports();
    const index = reports.findIndex((r) => r.id === reportId);
    if (index === -1) {
      throw new Error("Report not found.");
    }
    const reviewer = mockProfiles[0] ?? null;
    const updated: Report = {
      ...reports[index],
      status,
      reviewedBy: reviewer?.id ?? null,
      reviewedAt: new Date().toISOString(),
      resolutionNote: resolutionNote ?? reports[index].resolutionNote ?? null
    };
    reports[index] = updated;
    return updated;
  }

  const reviewerId = await getCurrentUserId();

  if (!reviewerId) {
    throw new Error("You must be authenticated to update a report.");
  }

  const payload: Record<string, string | null> = {
    status,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString()
  };

  if (resolutionNote !== undefined) {
    payload.resolution_note = resolutionNote;
  }

  const { data, error } = await supabase
    .from("reports")
    .update(payload)
    .eq("id", reportId)
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, reviewed_by, reviewed_at, resolution_note, created_at, reporter:reporter_id(id, username, display_name, avatar_url, bio, safety_mode, is_moderator, created_at, updated_at)"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update report.");
  }

  return mapReportRow(data as ReportRow);
}
