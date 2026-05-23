import { mockEvents } from "../data/mockEvents";
import { MOCK_USER_ID } from "../lib/constants";
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

type RsvpRow = {
  event_id: string;
  user_id: string;
  status: string | null;
  created_at: string;
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
    sourceType: (row.source_type ?? (row.group_id ? "group" : "place")) as EventSourceType,
    sourceMessageId: row.source_message_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function mapRsvpRow(row: RsvpRow): EventAttendee {
  return {
    id: `${row.event_id}:${row.user_id}`,
    eventId: row.event_id,
    userId: row.user_id,
    status: (row.status ?? "going") as EventAttendeeStatus,
    joinedAt: row.created_at
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

export async function getEventsByGroup(groupId: string): Promise<LocalEvent[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockEvents.filter((event) => event.groupId === groupId);
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("group_id", groupId)
    .order("starts_at", { ascending: true });

  if (error || !data) {
    console.warn("Falling back to mock events by group:", error?.message);
    return mockEvents.filter((event) => event.groupId === groupId);
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

export type CreateEventInput = {
  placeId?: string | null;
  groupId?: string | null;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  accessLevel?: AccessLevel;
};

export async function createEvent(input: CreateEventInput): Promise<LocalEvent> {
  const title = input.title.trim();

  if (!title) {
    throw new Error("El titulo del evento es obligatorio.");
  }
  if (!input.startsAt) {
    throw new Error("La fecha y hora de inicio son obligatorias.");
  }
  if (!input.placeId && !input.groupId) {
    throw new Error("El evento necesita un lugar o un grupo.");
  }

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("La fecha de inicio no es valida.");
  }

  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    throw new Error("La fecha de fin no es valida.");
  }
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("La fecha de fin debe ser posterior al inicio.");
  }

  const description = input.description?.trim() || null;
  const accessLevel = input.accessLevel ?? "public";

  if (!isSupabaseConfigured || !supabase) {
    const now = new Date().toISOString();
    const created: LocalEvent = {
      id: `mock-event-${Date.now()}`,
      placeId: input.placeId ?? "",
      groupId: input.groupId ?? null,
      createdBy: MOCK_USER_ID,
      title,
      description,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt ? endsAt.toISOString() : null,
      capacity: null,
      accessLevel,
      sourceType: input.groupId ? "group" : "place",
      sourceMessageId: null,
      createdAt: now,
      updatedAt: now
    };
    mockEvents.unshift(created);
    return created;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Debes iniciar sesion para crear un evento.");
  }

  let placeId = input.placeId ?? null;

  if (!placeId && input.groupId) {
    const { data: groupRow } = await supabase
      .from("groups")
      .select("place_id")
      .eq("id", input.groupId)
      .maybeSingle();
    placeId = (groupRow as { place_id: string | null } | null)?.place_id ?? null;
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      place_id: placeId,
      group_id: input.groupId ?? null,
      title,
      description,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      created_by: userId
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el evento.");
  }

  const event = mapEventRow(data as EventRow);

  await supabase
    .from("event_rsvps")
    .upsert({ event_id: event.id, user_id: userId, status: "going" }, { onConflict: "event_id,user_id" });

  return event;
}

export type UpdateEventInput = {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string | null;
};

export async function updateEvent(id: string, patch: UpdateEventInput): Promise<LocalEvent> {
  if (!isSupabaseConfigured || !supabase) {
    const index = mockEvents.findIndex((event) => event.id === id);
    if (index === -1) {
      throw new Error("Evento no encontrado en mocks.");
    }
    const current = mockEvents[index];
    const updated: LocalEvent = {
      ...current,
      title: patch.title?.trim() || current.title,
      description: patch.description !== undefined ? (patch.description?.trim() || null) : current.description,
      startsAt: patch.startsAt || current.startsAt,
      endsAt: patch.endsAt !== undefined ? patch.endsAt : current.endsAt,
      updatedAt: new Date().toISOString()
    };
    mockEvents[index] = updated;
    return updated;
  }

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.description !== undefined) update.description = patch.description?.trim() || null;
  if (patch.startsAt !== undefined) {
    const value = new Date(patch.startsAt);
    if (Number.isNaN(value.getTime())) {
      throw new Error("La fecha de inicio no es valida.");
    }
    update.starts_at = value.toISOString();
  }
  if (patch.endsAt !== undefined) {
    if (patch.endsAt) {
      const value = new Date(patch.endsAt);
      if (Number.isNaN(value.getTime())) {
        throw new Error("La fecha de fin no es valida.");
      }
      update.ends_at = value.toISOString();
    } else {
      update.ends_at = null;
    }
  }

  const { data, error } = await supabase.from("events").update(update).eq("id", id).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar el evento.");
  }

  return mapEventRow(data as EventRow);
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const index = mockEvents.findIndex((event) => event.id === id);
    if (index !== -1) mockEvents.splice(index, 1);
    return;
  }

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function joinEvent(eventId: string): Promise<EventAttendee> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      id: `mock-event-attendee-${Date.now()}`,
      eventId,
      userId: MOCK_USER_ID,
      status: "going",
      joinedAt: new Date().toISOString()
    };
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Debes iniciar sesion para confirmar asistencia.");
  }

  const { data, error } = await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, user_id: userId, status: "going" }, { onConflict: "event_id,user_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo registrar tu asistencia.");
  }

  return mapRsvpRow(data as RsvpRow);
}

export async function cancelRsvp(eventId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Debes iniciar sesion para cancelar tu asistencia.");
  }

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getMyRsvp(eventId: string): Promise<EventAttendee | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRsvpRow(data as RsvpRow);
}

export async function getMyEvents(): Promise<LocalEvent[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockEvents.filter((event) => event.createdBy === MOCK_USER_ID);
  }

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const [createdRes, rsvpRes] = await Promise.all([
    supabase.from("events").select("*").eq("created_by", userId),
    supabase.from("event_rsvps").select("event_id").eq("user_id", userId)
  ]);

  const created = (createdRes.data ?? []) as EventRow[];
  const rsvpIds = ((rsvpRes.data ?? []) as { event_id: string }[]).map((row) => row.event_id);
  const missingIds = rsvpIds.filter((id) => !created.some((row) => row.id === id));

  let attending: EventRow[] = [];
  if (missingIds.length > 0) {
    const { data } = await supabase.from("events").select("*").in("id", missingIds);
    attending = (data ?? []) as EventRow[];
  }

  return [...created, ...attending].map(mapEventRow).sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
}
