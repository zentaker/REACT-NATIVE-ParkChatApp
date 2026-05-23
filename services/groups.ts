import { mockGroups } from "../data/mockGroups";
import { MOCK_USER_ID } from "../lib/constants";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { AccessLevel, GroupMember, GroupMemberRole, LocalGroup } from "../types";

type GroupRow = {
  id: string;
  place_id: string | null;
  created_by: string | null;
  name: string;
  description: string | null;
  visibility?: string | null;
  access_level?: string | null;
  member_count?: number | null;
  created_at: string;
  updated_at?: string | null;
};

type GroupMemberRow = {
  group_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
};

function mapGroupRow(row: GroupRow): LocalGroup {
  return {
    id: row.id,
    placeId: row.place_id ?? "",
    createdBy: row.created_by,
    name: row.name,
    description: row.description,
    accessLevel: (row.access_level ?? row.visibility ?? "public") as AccessLevel,
    memberCount: row.member_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function mapMemberRow(row: GroupMemberRow): GroupMember {
  return {
    id: `${row.group_id}:${row.user_id}`,
    groupId: row.group_id,
    userId: row.user_id,
    role: (row.role ?? "member") as GroupMemberRole,
    status: "active",
    joinedAt: row.created_at
  };
}

function mockVisibilityToAccessLevel(value?: string | null): AccessLevel {
  return (value ?? "public") as AccessLevel;
}

export async function getGroupsByPlace(placeId: string): Promise<LocalGroup[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockGroups.filter((group) => group.placeId === placeId);
  }

  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Falling back to mock groups:", error?.message);
    return mockGroups.filter((group) => group.placeId === placeId);
  }

  return (data as GroupRow[]).map(mapGroupRow);
}

export async function getGroupById(id: string): Promise<LocalGroup | null> {
  if (!isSupabaseConfigured || !supabase) {
    return mockGroups.find((group) => group.id === id) ?? null;
  }

  const { data, error } = await supabase.from("groups").select("*").eq("id", id).single();

  if (error || !data) {
    console.warn("Falling back to mock group:", error?.message);
    return mockGroups.find((group) => group.id === id) ?? null;
  }

  return mapGroupRow(data as GroupRow);
}

export type CreateGroupInput = {
  placeId: string;
  name: string;
  description?: string | null;
  accessLevel?: AccessLevel;
};

export async function createGroup(input: CreateGroupInput): Promise<LocalGroup> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del grupo es obligatorio.");
  }

  if (!input.placeId) {
    throw new Error("Falta el lugar al que pertenece el grupo.");
  }

  const description = input.description?.trim() || null;
  const accessLevel = input.accessLevel ?? "public";

  if (!isSupabaseConfigured || !supabase) {
    const now = new Date().toISOString();
    const created: LocalGroup = {
      id: `mock-group-${Date.now()}`,
      placeId: input.placeId,
      createdBy: MOCK_USER_ID,
      name,
      description,
      accessLevel,
      memberCount: 1,
      createdAt: now,
      updatedAt: now
    };
    mockGroups.unshift(created);
    return created;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Debes iniciar sesion para crear un grupo.");
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      place_id: input.placeId,
      name,
      description,
      visibility: accessLevel,
      created_by: userId
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el grupo.");
  }

  const group = mapGroupRow(data as GroupRow);

  await supabase
    .from("group_members")
    .upsert({ group_id: group.id, user_id: userId, role: "owner" }, { onConflict: "group_id,user_id" });

  return group;
}

export type UpdateGroupInput = {
  name?: string;
  description?: string | null;
  accessLevel?: AccessLevel;
};

export async function updateGroup(id: string, patch: UpdateGroupInput): Promise<LocalGroup> {
  if (!isSupabaseConfigured || !supabase) {
    const index = mockGroups.findIndex((group) => group.id === id);
    if (index === -1) {
      throw new Error("Grupo no encontrado en mocks.");
    }
    const current = mockGroups[index];
    const updated: LocalGroup = {
      ...current,
      name: patch.name?.trim() || current.name,
      description: patch.description !== undefined ? (patch.description?.trim() || null) : current.description,
      accessLevel: patch.accessLevel ?? current.accessLevel,
      updatedAt: new Date().toISOString()
    };
    mockGroups[index] = updated;
    return updated;
  }

  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.description !== undefined) update.description = patch.description?.trim() || null;
  if (patch.accessLevel !== undefined) update.visibility = patch.accessLevel;

  const { data, error } = await supabase.from("groups").update(update).eq("id", id).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar el grupo.");
  }

  return mapGroupRow(data as GroupRow);
}

export async function deleteGroup(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const index = mockGroups.findIndex((group) => group.id === id);
    if (index !== -1) mockGroups.splice(index, 1);
    return;
  }

  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function joinGroup(groupId: string): Promise<GroupMember> {
  if (!isSupabaseConfigured || !supabase) {
    const group = mockGroups.find((g) => g.id === groupId);
    if (group) {
      group.memberCount = (group.memberCount ?? 0) + 1;
    }
    return {
      id: `mock-group-member-${Date.now()}`,
      groupId,
      userId: MOCK_USER_ID,
      role: "member",
      status: "active",
      joinedAt: new Date().toISOString()
    };
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Debes iniciar sesion para unirte a un grupo.");
  }

  const { data, error } = await supabase
    .from("group_members")
    .upsert({ group_id: groupId, user_id: userId, role: "member" }, { onConflict: "group_id,user_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo unir al grupo.");
  }

  return mapMemberRow(data as GroupMemberRow);
}

export async function leaveGroup(groupId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const group = mockGroups.find((g) => g.id === groupId);
    if (group && (group.memberCount ?? 0) > 0) {
      group.memberCount = (group.memberCount ?? 0) - 1;
    }
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Debes iniciar sesion para salir del grupo.");
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getMyGroupMembership(groupId: string): Promise<GroupMember | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapMemberRow(data as GroupMemberRow);
}

export async function getMyGroups(): Promise<LocalGroup[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockGroups.filter((group) => group.createdBy === MOCK_USER_ID);
  }

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const [createdRes, memberRes] = await Promise.all([
    supabase.from("groups").select("*").eq("created_by", userId),
    supabase.from("group_members").select("group_id").eq("user_id", userId)
  ]);

  const created = (createdRes.data ?? []) as GroupRow[];
  const memberIds = ((memberRes.data ?? []) as { group_id: string }[]).map((row) => row.group_id);
  const missingIds = memberIds.filter((id) => !created.some((row) => row.id === id));

  let joined: GroupRow[] = [];
  if (missingIds.length > 0) {
    const { data } = await supabase.from("groups").select("*").in("id", missingIds);
    joined = (data ?? []) as GroupRow[];
  }

  return [...created, ...joined].map(mapGroupRow).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
