export type AccessLevel =
  | "public"
  | "local_only"
  | "invite_only"
  | "approval_required"
  | "verified_only"
  | "private";

export type GroupMemberRole = "owner" | "moderator" | "member";
export type GroupMemberStatus = "active" | "pending" | "blocked";

export type LocalGroup = {
  id: string;
  placeId: string;
  createdBy: string | null;
  name: string;
  description: string | null;
  accessLevel: AccessLevel;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string;
};
