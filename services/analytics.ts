/**
 * services/analytics.ts
 * Product analytics — fire-and-forget client-side event tracking.
 *
 * RULES:
 * - Never block the main action.
 * - Never log sensitive metadata.
 * - Never store exact coordinates.
 * - If insert fails, log a safe message only.
 */

import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { ProductEventName, ProductEventPayload } from "../types/analytics";

function safePlatform(): string {
  return Platform.OS ?? "unknown";
}

/**
 * Core: insert a product_event row. Fire-and-forget — never throws.
 */
export async function trackEvent(
  eventName: ProductEventName,
  payload: ProductEventPayload = {}
): Promise<void> {
  try {
    const userId = await getCurrentUserId().catch(() => null);
    if (!userId || !supabase) return;

    const { placeId, groupId, eventId, topicTagId, sessionId, metadata = {} } = payload;

    const safeMetadata: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(metadata)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        safeMetadata[k] = v;
      }
    }

    const { error } = await supabase.from("product_events").insert({
      user_id: userId,
      event_name: eventName,
      place_id: placeId ?? null,
      group_id: groupId ?? null,
      app_event_id: eventId ?? null,
      topic_tag_id: topicTagId ?? null,
      metadata: safeMetadata,
      session_id: sessionId ?? null,
      platform: safePlatform()
    });

    if (error) {
      console.warn("[analytics] insert failed:", error.code);
    }
  } catch {
    console.warn("[analytics] trackEvent error (non-blocking)");
  }
}

export function trackPlaceViewed(placeId: string): void {
  void trackEvent("place_viewed", { placeId });
}

export function trackChatOpened(placeId: string): void {
  void trackEvent("chat_opened", { placeId });
}

export function trackMessageSent(placeId: string): void {
  void trackEvent("message_sent", { placeId });
}

export function trackGroupCreated(placeId: string, groupId: string): void {
  void trackEvent("group_created", { placeId, groupId });
}

export function trackGroupJoined(groupId: string): void {
  void trackEvent("group_joined", { groupId });
}

export function trackGroupApprovalRequested(groupId: string): void {
  void trackEvent("group_approval_requested", { groupId });
}

export function trackEventCreated(placeId: string, eventId: string): void {
  void trackEvent("event_created", { placeId, eventId });
}

export function trackRsvpChanged(eventId: string, status: string): void {
  void trackEvent("rsvp_changed", {
    eventId,
    metadata: { status }
  });
}

export function trackReportCreated(): void {
  void trackEvent("report_created");
}

export function trackBlockCreated(): void {
  void trackEvent("block_created");
}

export function trackNotificationRead(notificationId: string): void {
  void trackEvent("notification_read", {
    metadata: { notification_id: notificationId }
  });
}

export function trackTopicUsed(topicTagId: string, placeId?: string): void {
  void trackEvent("topic_used", { topicTagId, placeId });
}

export function trackGeofenceBlocked(placeId: string): void {
  void trackEvent("geofence_blocked", { placeId });
}

export function trackFeedbackSubmitted(): void {
  void trackEvent("feedback_submitted");
}
