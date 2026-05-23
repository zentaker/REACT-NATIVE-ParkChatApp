import type { LocalGroup } from "../types";
import { PLACE_IDS } from "../lib/constants";

export const mockGroups: LocalGroup[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    placeId: PLACE_IDS.parqueKennedy,
    createdBy: null,
    name: "Club de conversacion japonesa",
    description: "Practica informal de japones en espacios abiertos y seguros.",
    accessLevel: "approval_required",
    memberCount: 24,
    createdAt: "2026-05-05T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    placeId: PLACE_IDS.parqueKennedy,
    createdBy: null,
    name: "Skaters del parque",
    description: "Puntos de practica, horarios y apoyo para principiantes.",
    accessLevel: "local_only",
    memberCount: 41,
    createdAt: "2026-05-05T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    placeId: PLACE_IDS.parqueKennedy,
    createdBy: null,
    name: "Lectura al aire libre",
    description: "Lecturas sabatinas, intercambio de libros y cafe cercano.",
    accessLevel: "public",
    memberCount: 16,
    createdAt: "2026-05-05T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    placeId: PLACE_IDS.coworkingCreativo,
    createdBy: null,
    name: "Nomadas digitales",
    description: "Comunidad local para trabajo remoto, cafes y colaboraciones.",
    accessLevel: "public",
    memberCount: 33,
    createdAt: "2026-05-05T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    placeId: PLACE_IDS.barrancoPlaza,
    createdBy: null,
    name: "Comunidad queer segura",
    description: "Grupo con moderacion activa y normas claras de cuidado.",
    accessLevel: "approval_required",
    memberCount: 28,
    createdAt: "2026-05-05T15:00:00.000Z",
    updatedAt: "2026-05-20T15:00:00.000Z"
  }
];
