export type ProductEventName =
  | "place_viewed"
  | "chat_opened"
  | "message_sent"
  | "group_created"
  | "group_joined"
  | "group_approval_requested"
  | "group_approval_accepted"
  | "group_approval_rejected"
  | "event_created"
  | "rsvp_changed"
  | "report_created"
  | "block_created"
  | "notification_read"
  | "topic_used"
  | "geofence_blocked"
  | "feedback_submitted"
  | "onboarding_viewed"
  | "profile_viewed";

export type ProductEventPayload = {
  placeId?: string;
  groupId?: string;
  eventId?: string;
  topicTagId?: string;
  sessionId?: string;
  platform?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ProductEvent = {
  id: string;
  userId: string | null;
  eventName: ProductEventName;
  placeId: string | null;
  groupId: string | null;
  appEventId: string | null;
  topicTagId: string | null;
  metadata: Record<string, unknown>;
  sessionId: string | null;
  platform: string | null;
  createdAt: string;
};
