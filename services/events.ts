import { mockEvents } from "../data/mockEvents";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { AccessLevel, EventAttendee, EventAttendeeStatus, EventSourceType, LocalEvent } from "../types";

type EventRow = {
  id: string;
  place_id: string | null;
  group_id: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity?: number | null;
  access_level?: string | null;
  source_type?: string | null;
  source_message_id?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function mapEventRow(row: EventRow): LocalEvent {
  return {
    id: row.id,
    placeId: row.place_id ?? "",
    groupId: row.group_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity ?? null,
    accessLevel: (row.access_level ?? "public") as AccessLevel,
    sourceType: (row.source_type ?? "place") as EventSourceType,
    sourceMessageId: row.source_message_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

export async function getEventsByPlace(placeId: string): Promise<LocalEvent[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockEvents.filter((event) => event.placeId === placeId);
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("place_id", placeId)
    .order("starts_at", { ascending: true });

  if (error || !data) {
    console.warn("Falling back to mock events:", error?.message);
    return mockEvents.filter((event) => event.placeId === placeId);
  }

  return (data as EventRow[]).map(mapEventRow);
}

export async function getEventById(id: string): Promise<LocalEvent | null> {
  if (!isSupabaseConfigured || !supabase) {
    return mockEvents.find((event) => event.id === id) ?? null;
  }

  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();

  if (error || !data) {
    console.warn("Falling back to mock event:", error?.message);
    return mockEvents.find((event) => event.id === id) ?? null;
  }

  return mapEventRow(data as EventRow);
}

export async function joinEvent(eventId: string): Promise<EventAttendee> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      id: `mock-event-attendee-${Date.now()}`,
      eventId,
      userId: "mock-user",
      status: "going",
      joinedAt: new Date().toISOString()
    };
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be authenticated to join an event.");
  }

  const { data, error } = await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, user_id: userId, status: "going" }, { onConflict: "event_id,user_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not RSVP to event.");
  }

  const row = data as {
    event_id: string;
    user_id: string;
    status: string | null;
    created_at: string;
  };

  return {
    id: `${row.event_id}:${row.user_id}`,
    eventId: row.event_id,
    userId: row.user_id,
    status: (row.status ?? "going") as EventAttendeeStatus,
    joinedAt: row.created_at
  };
}
