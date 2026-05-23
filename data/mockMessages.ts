import type { PlaceMessage } from "../types";
import { PLACE_IDS } from "../lib/constants";
import { mockProfiles } from "./mockProfiles";

export const mockMessages: PlaceMessage[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    placeId: PLACE_IDS.parqueKennedy,
    userId: mockProfiles[1].id,
    body: "Alguien se apunta a practicar japones a las 6? Podemos sentarnos cerca de la feria.",
    moderationStatus: "visible",
    createdAt: "2026-05-22T20:10:00.000Z",
    profile: mockProfiles[1],
    topicTags: [{ id: "dddddddd-dddd-4ddd-8ddd-dddddddddd01", name: "japones", createdAt: "2026-05-01T15:00:00.000Z" }]
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
    placeId: PLACE_IDS.parqueKennedy,
    userId: mockProfiles[2].id,
    body: "Hay un grupo de skate suave hoy. Si alguien es nuevo, le prestamos tabla para probar.",
    moderationStatus: "visible",
    createdAt: "2026-05-22T20:18:00.000Z",
    profile: mockProfiles[2],
    topicTags: [{ id: "dddddddd-dddd-4ddd-8ddd-dddddddddd02", name: "skate", createdAt: "2026-05-01T15:00:00.000Z" }]
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
    placeId: PLACE_IDS.barrancoPlaza,
    userId: mockProfiles[0].id,
    body: "La caminata sale desde la plaza y volvemos juntos. Plan tranquilo, sin compartir ubicacion exacta.",
    moderationStatus: "visible",
    createdAt: "2026-05-22T20:25:00.000Z",
    profile: mockProfiles[0],
    topicTags: [{ id: "dddddddd-dddd-4ddd-8ddd-dddddddddd03", name: "caminata", createdAt: "2026-05-01T15:00:00.000Z" }]
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc4",
    placeId: PLACE_IDS.cafeCultural,
    userId: mockProfiles[0].id,
    body: "Estoy trabajando en una app y me quedo una hora. Si alguien quiere feedback cruzado, avise.",
    moderationStatus: "visible",
    createdAt: "2026-05-22T20:40:00.000Z",
    profile: mockProfiles[0],
    topicTags: [{ id: "dddddddd-dddd-4ddd-8ddd-dddddddddd04", name: "freelance", createdAt: "2026-05-01T15:00:00.000Z" }]
  }
];
