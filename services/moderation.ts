import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";

export type ReportTargetType = "profile" | "place" | "message" | "group" | "event";

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string | null;
};

export async function reportContent(input: CreateReportInput): Promise<{ id: string }> {
  if (!input.reason.trim()) {
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
      reason: input.reason.trim(),
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
    return;
  }

  const blockerId = await getCurrentUserId();

  if (!blockerId) {
    throw new Error("You must be authenticated to block a user.");
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
