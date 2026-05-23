import { mockGroups } from "../data/mockGroups";
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

export async function joinGroup(groupId: string): Promise<GroupMember> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      id: `mock-group-member-${Date.now()}`,
      groupId,
      userId: "mock-user",
      role: "member",
      status: "active",
      joinedAt: new Date().toISOString()
    };
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be authenticated to join a group.");
  }

  const { data, error } = await supabase
    .from("group_members")
    .upsert({ group_id: groupId, user_id: userId, role: "member" }, { onConflict: "group_id,user_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not join group.");
  }

  const row = data as {
    group_id: string;
    user_id: string;
    role: string | null;
    created_at: string;
  };

  return {
    id: `${row.group_id}:${row.user_id}`,
    groupId: row.group_id,
    userId: row.user_id,
    role: (row.role ?? "member") as GroupMemberRole,
    status: "active",
    joinedAt: row.created_at
  };
}
