import type { Profile } from "../types";
import { MOCK_USER_ID } from "../lib/constants";

export const mockProfiles: Profile[] = [
  {
    id: MOCK_USER_ID,
    username: "ana_local",
    displayName: "Ana",
    avatarUrl: null,
    bio: "Me interesan los espacios culturales, idiomas y eventos tranquilos.",
    safetyMode: "approximate",
    isModerator: true,
    createdAt: "2026-05-01T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    username: "sandra_jp",
    displayName: "Sandra",
    avatarUrl: null,
    bio: "Practico japones y busco grupos locales.",
    safetyMode: "standard",
    isModerator: false,
    createdAt: "2026-05-02T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    username: "leo_skate",
    displayName: "Leo",
    avatarUrl: null,
    bio: "Skate, lectura al aire libre y caminatas.",
    safetyMode: "standard",
    isModerator: false,
    createdAt: "2026-05-03T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  }
];
