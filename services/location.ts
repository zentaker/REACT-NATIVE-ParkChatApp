import type { Place } from "../types";
import type { LocationPermissionStatus, UserLocation } from "../types/location";

const NEARBY_THRESHOLD_METERS = 2000;

export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinPlaceRadius(
  userLocation: UserLocation,
  place: Pick<Place, "latitude" | "longitude" | "radiusMeters">
): boolean {
  const dist = calculateDistanceMeters(
    userLocation.latitude,
    userLocation.longitude,
    place.latitude,
    place.longitude
  );
  return dist <= (place.radiusMeters ?? 150);
}

export function formatDistanceLabel(meters: number): string {
  if (meters < 50) return "cerca de ti";
  if (meters < 1000) return `a ${Math.round(meters)} m`;
  return `a ${(meters / 1000).toFixed(1)} km`;
}

export function getLocationErrorMessage(error: unknown): string {
  if (!error) return "Ubicación no disponible";
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: number }).code;
    if (code === 1) return "Permiso de ubicación denegado";
    if (code === 2) return "Ubicación no disponible en este dispositivo";
    if (code === 3) return "Tiempo de espera agotado al obtener ubicación";
  }
  return "No se pudo obtener la ubicación";
}

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  try {
    const ExpoLocation = await import("expo-location");
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "unknown";
  } catch {
    return "unavailable";
  }
}

export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const ExpoLocation = await import("expo-location");
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "unknown";
  } catch {
    return "unavailable";
  }
}

export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    const ExpoLocation = await import("expo-location");
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const loc = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      timestamp: loc.timestamp
    };
  } catch {
    return null;
  }
}
