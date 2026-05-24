import Constants from "expo-constants";
import type { Place } from "../types";
import type { UserLocation } from "../types/location";
import { calculateDistanceMeters, isWithinPlaceRadius } from "./location";

export type GeofenceStatus =
  | "inside_radius"
  | "nearby"
  | "outside"
  | "no_location"
  | "permission_denied";

export type GeofenceResult = {
  status: GeofenceStatus;
  canPost: boolean;
  message: string | null;
  distanceMeters: number | null;
};

export function shouldRequireGeofencePosting(): boolean {
  const val =
    Constants.expoConfig?.extra?.strictGeofencePosting ??
    process.env?.EXPO_PUBLIC_STRICT_GEOFENCE_POSTING;
  return val === true || val === "true";
}

export function getGeofenceStatus(
  userLocation: UserLocation | null,
  place: Pick<Place, "latitude" | "longitude" | "radiusMeters">
): GeofenceStatus {
  if (!userLocation) return "no_location";

  const dist = calculateDistanceMeters(
    userLocation.latitude,
    userLocation.longitude,
    place.latitude,
    place.longitude
  );

  if (dist <= (place.radiusMeters ?? 150)) return "inside_radius";
  if (dist <= 2000) return "nearby";
  return "outside";
}

export function getGeofenceMessage(status: GeofenceStatus, strictMode: boolean): string | null {
  if (!strictMode) {
    switch (status) {
      case "inside_radius":
        return null;
      case "nearby":
      case "outside":
        return "Modo flexible: puedes participar aunque no validemos ubicación exacta.";
      case "no_location":
      case "permission_denied":
        return "Ubicación no disponible. Puedes participar en modo flexible.";
    }
  }

  switch (status) {
    case "inside_radius":
      return null;
    case "nearby":
      return "Estás cerca pero fuera del área. Acércate para escribir en este chat.";
    case "outside":
      return "Para escribir en este chat debes estar dentro del área del lugar.";
    case "no_location":
      return "Activa la ubicación para participar en modo estricto.";
    case "permission_denied":
      return "Permiso de ubicación denegado. No puedes postear en modo estricto.";
  }
}

export function canPostInPlaceChat(params: {
  userLocation: UserLocation | null;
  place: Pick<Place, "latitude" | "longitude" | "radiusMeters">;
  requireInsideRadius?: boolean;
}): GeofenceResult {
  const { userLocation, place, requireInsideRadius } = params;
  const strictMode = requireInsideRadius ?? shouldRequireGeofencePosting();

  const distanceMeters = userLocation
    ? calculateDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      )
    : null;

  const status = getGeofenceStatus(userLocation, place);
  const message = getGeofenceMessage(status, strictMode);

  let canPost: boolean;
  if (!strictMode) {
    canPost = true;
  } else {
    canPost = status === "inside_radius";
  }

  return { status, canPost, message, distanceMeters };
}
