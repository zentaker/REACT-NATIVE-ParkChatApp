import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { CreateNotificationInput, InAppNotification, NotificationType } from "../types/notifications";

type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  place_id: string | null;
  group_id: string | null;
  event_id: string | null;
  report_id: string | null;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

function mapRow(row: NotificationRow): InAppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id,
    placeId: row.place_id,
    groupId: row.group_id,
    eventId: row.event_id,
    reportId: row.report_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
    isRead: row.read_at !== null
  };
}

export async function getMyNotifications(limit = 40): Promise<InAppNotification[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("in_app_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[notifications] getMyNotifications error:", error.message);
    return [];
  }
  return (data as NotificationRow[]).map(mapRow);
}

export async function getUnreadNotificationCount(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;

  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("in_app_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.warn("[notifications] getUnreadNotificationCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) {
    console.warn("[notifications] markNotificationRead error:", error.message);
    return false;
  }
  return true;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.warn("[notifications] markAllNotificationsRead error:", error.message);
    return false;
  }
  return true;
}

export async function createNotification(input: CreateNotificationInput): Promise<InAppNotification | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const actorId = await getCurrentUserId();
  if (!actorId) return null;

  const { data, error } = await supabase
    .from("in_app_notifications")
    .insert({
      user_id: input.userId,
      actor_id: actorId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      place_id: input.placeId ?? null,
      group_id: input.groupId ?? null,
      event_id: input.eventId ?? null,
      report_id: input.reportId ?? null
    })
    .select()
    .single();

  if (error) {
    console.warn("[notifications] createNotification error:", error.message);
    return null;
  }
  return mapRow(data as NotificationRow);
}

export async function createGroupJoinRequestNotification(params: {
  ownerUserId: string;
  groupId: string;
  groupName: string;
  placeId?: string | null;
}): Promise<void> {
  await createNotification({
    userId: params.ownerUserId,
    type: "group_join_request",
    title: `Nueva solicitud para unirse a "${params.groupName}"`,
    body: "Alguien quiere unirse a tu grupo. Revisa la lista de miembros pendientes.",
    groupId: params.groupId,
    placeId: params.placeId
  }).catch((err) => {
    console.warn("[notifications] createGroupJoinRequestNotification failed:", err?.message);
  });
}

export async function createGroupApprovalNotification(params: {
  requesterUserId: string;
  groupId: string;
  groupName: string;
  approved: boolean;
  placeId?: string | null;
}): Promise<void> {
  await createNotification({
    userId: params.requesterUserId,
    type: params.approved ? "group_member_approved" : "group_member_rejected",
    title: params.approved
      ? `Tu solicitud para "${params.groupName}" fue aprobada`
      : `Tu solicitud para "${params.groupName}" no fue aprobada`,
    body: params.approved
      ? "Ya puedes participar en el grupo."
      : "El administrador del grupo revisó tu solicitud.",
    groupId: params.groupId,
    placeId: params.placeId
  }).catch((err) => {
    console.warn("[notifications] createGroupApprovalNotification failed:", err?.message);
  });
}

export async function createEventRsvpNotification(params: {
  eventCreatorUserId: string;
  eventId: string;
  eventTitle: string;
  rsvpStatus: string;
  placeId?: string | null;
}): Promise<void> {
  await createNotification({
    userId: params.eventCreatorUserId,
    type: "event_rsvp_changed",
    title: `Alguien cambió su asistencia a "${params.eventTitle}"`,
    body: `Estado: ${params.rsvpStatus}`,
    eventId: params.eventId,
    placeId: params.placeId
  }).catch((err) => {
    console.warn("[notifications] createEventRsvpNotification failed:", err?.message);
  });
}

export async function createReportNotification(params: {
  moderatorUserId: string;
  reportId: string;
  targetType: string;
}): Promise<void> {
  await createNotification({
    userId: params.moderatorUserId,
    type: "report_created",
    title: "Nuevo reporte pendiente de revisión",
    body: `Tipo de contenido: ${params.targetType}`,
    reportId: params.reportId
  }).catch((err) => {
    console.warn("[notifications] createReportNotification failed:", err?.message);
  });
}
