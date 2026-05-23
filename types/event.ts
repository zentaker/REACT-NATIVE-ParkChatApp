import type { AccessLevel } from "./group";

export type EventSourceType = "place" | "group" | "message";
export type EventAttendeeStatus = "going" | "interested" | "cancelled";

export type LocalEvent = {
  id: string;
  placeId: string;
  groupId?: string | null;
  createdBy: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt?: string | null;
  capacity?: number | null;
  accessLevel: AccessLevel;
  sourceType: EventSourceType;
  sourceMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventAttendee = {
  id: string;
  eventId: string;
  userId: string;
  status: EventAttendeeStatus;
  joinedAt: string;
};
