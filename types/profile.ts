export type SafetyMode = "standard" | "approximate" | "invisible";

export type Profile = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  safetyMode: SafetyMode;
  isModerator: boolean;
  createdAt: string;
  updatedAt: string;
};
