export type NotificationType =
  | "group_join_request"
  | "group_member_approved"
  | "group_member_rejected"
  | "event_rsvp_changed"
  | "report_created"
  | "report_status_changed"
  | "geofence_blocked_post"
  | "topic_trending";

export type InAppNotification = {
  id: string;
  userId: string;
  actorId: string | null;
  placeId: string | null;
  groupId: string | null;
  eventId: string | null;
  reportId: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  isRead: boolean;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  placeId?: string | null;
  groupId?: string | null;
  eventId?: string | null;
  reportId?: string | null;
};
