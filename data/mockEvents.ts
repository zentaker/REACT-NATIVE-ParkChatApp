import type { LocalEvent } from "../types";
import { PLACE_IDS } from "../lib/constants";

export const mockEvents: LocalEvent[] = [
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    placeId: PLACE_IDS.parqueKennedy,
    groupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    createdBy: null,
    title: "Picnic de conversacion",
    description: "Mesa tranquila para practicar japones y conocer gente del parque.",
    startsAt: "2026-05-24T22:00:00.000Z",
    endsAt: "2026-05-25T00:00:00.000Z",
    capacity: 12,
    accessLevel: "approval_required",
    sourceType: "message",
    sourceMessageId: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    createdAt: "2026-05-10T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    placeId: PLACE_IDS.barrancoPlaza,
    groupId: null,
    createdBy: null,
    title: "Caminata grupal",
    description: "Ruta corta por Barranco, pensada para llegar y volver en grupo.",
    startsAt: "2026-05-25T21:30:00.000Z",
    endsAt: "2026-05-25T23:00:00.000Z",
    capacity: 20,
    accessLevel: "public",
    sourceType: "place",
    sourceMessageId: null,
    createdAt: "2026-05-10T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    placeId: PLACE_IDS.parqueKennedy,
    groupId: null,
    createdBy: null,
    title: "Intercambio cultural",
    description: "Conversaciones por mesas: idiomas, musica, comida y viajes.",
    startsAt: "2026-05-26T22:30:00.000Z",
    endsAt: null,
    capacity: 18,
    accessLevel: "public",
    sourceType: "place",
    sourceMessageId: null,
    createdAt: "2026-05-10T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    placeId: PLACE_IDS.cafeCultural,
    groupId: null,
    createdBy: null,
    title: "Cafe de freelancers",
    description: "Encuentro ligero para compartir proyectos y pedir feedback.",
    startsAt: "2026-05-27T16:00:00.000Z",
    endsAt: "2026-05-27T18:00:00.000Z",
    capacity: 10,
    accessLevel: "public",
    sourceType: "place",
    sourceMessageId: null,
    createdAt: "2026-05-10T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  }
];
